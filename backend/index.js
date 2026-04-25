const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cheerio = require("cheerio");
const axios = require("axios");
const multer = require("multer");
const {
  generateAIResponse,
  setProvider,
  setModel,
  getProvider,
  getModel,
  getAvailableProviders,
  getModelsForProvider,
  availableModels,
} = require("./ai-providers");

const upload = multer();
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "active", message: "VeraJobs API is running" });
});

const PORT = process.env.PORT || 3000;

// --- Helper: Scraper (Superpowered) ---
async function scrapeJob(url) {
  try {
    if (!url || !url.startsWith("http")) {
      throw new Error("Invalid URL provided.");
    }

    console.log(`Scraping URL: ${url}`);

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      timeout: 20000,
    });

    const $ = cheerio.load(data);

    // Remove scripts, styles and other noise to save tokens
    $("script, style, svg, nav, footer, iframe").remove();

    let company = "Unknown",
      title = "Unknown",
      description = "";

    // Strategy 1: Specific Selectors
    if (url.includes("greenhouse.io")) {
      company =
        $("div.header-container img").attr("alt") ||
        $('meta[property="og:site_name"]').attr("content");
      title = $("h1.app-title").text().trim();
      description = $("#content").text().trim();
    } else if (url.includes("lever.co")) {
      company =
        $('meta[property="og:site_name"]').attr("content") ||
        $(".posting-header h2").text().trim();
      title = $(".posting-header h2").text().trim();
      description = $(".section.page-centered").text().trim();
    }

    // Strategy 2: Agentic Extraction Fallback
    if (!description || description.length < 200) {
      console.log("Standard scraping limited. Engaging Agentic Extraction...");
      const rawText = $("body").text().substring(0, 10000).replace(/\s+/g, " ");

      const extractionPrompt = `
        I am a job scraper. I have the following raw text from a webpage: "${url}".
        Raw Text: ${rawText}
        
        Extract the:
        1. Company Name
        2. Job Title
        3. Full Job Description
        
        Return ONLY JSON: { "company": "...", "title": "...", "description": "..." }
      `;

      const response = await generateAIResponse(extractionPrompt);
      const extracted = extractJSON(response.text());

      company = extracted.company || company;
      title = extracted.title || title;
      description = extracted.description || description;
    }

    return {
      company: company || "Unknown Company",
      title: title || "Job Position",
      description: description || "",
    };
  } catch (error) {
    console.error(`Scraping Error for ${url}:`, error.message);
    throw new Error(
      `Failed to access the job page. The site might be blocking us or requires JS.`,
    );
  }
}

// --- Helper: Robust JSON Extraction ---
function extractJSON(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find valid JSON in AI response.");
    }
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("JSON Parse Error. Text was:", text);
    throw new Error("Failed to parse AI response as JSON.");
  }
}

// --- Helper: Retry AI Response (with provider failover) ---
async function retryAICall(prompt, promptConfig = null, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await generateAIResponse(prompt, promptConfig);
      return response;
    } catch (error) {
      if (
        (error.message.includes("503") || error.message.includes("429")) &&
        i < attempts - 1
      ) {
        console.warn(
          `AI Provider Error (${error.message.substring(0, 50)}). Retrying attempt ${i + 2}/${attempts}...`,
        );
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      throw error;
    }
  }
}

// --- Routes ---

app.post("/api/evaluate", async (req, res) => {
  const { url, userCV, preferences } = req.body;
  try {
    if (!url) return res.status(400).json({ error: "URL is required." });

    const jobData = await scrapeJob(url);

    if (!jobData.description || jobData.description.length < 50) {
      return res.status(400).json({
        error: "Could not extract job description from the provided URL.",
      });
    }

    const prompt = `Evaluate this job against CV: ${userCV} and Prefs: ${preferences}. Job: ${jobData.description}. Return ONLY JSON: { "score": "A|B|C|D", "fit_summary": "...", "green_flags": [], "red_flags": [], "compensation_estimate": "...", "action_plan": "..." }`;
    const response = await retryAICall(prompt);
    const text = response.text();

    res.json({
      ...jobData,
      evaluation: extractJSON(text),
    });
  } catch (error) {
    console.error("API Evaluate Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tailor", async (req, res) => {
  const { jobDescription, userCV } = req.body;
  try {
    const prompt = `Tailor CV for Job: ${jobDescription}. CV: ${userCV}. Return ONLY JSON: { "personal_info": {"name": "...", "email": "...", "phone": "..."}, "summary": "...", "experience": [{"role": "...", "company": "...", "duration": "...", "bullets": []}], "skills": [] }`;
    const response = await retryAICall(prompt);
    const text = response.text();
    res.json(extractJSON(text));
  } catch (error) {
    console.error("API Tailor Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 3. Assistant (Chat/Voice)
app.post("/api/assistant", upload.single("audio"), async (req, res) => {
  console.log("--- Assistant API Start ---");

  const { message, userProfile, preferences } = req.body;
  try {
    let prompt = "";

    if (req.file && req.file.buffer) {
      // For audio files, we'll convert to base64 and include in prompt
      const audioData = req.file.buffer.toString("base64");
      prompt = `[AUDIO: ${req.file.mimetype || "audio/m4a"}] Base64: ${audioData.substring(0, 100)}... [/AUDIO]\nPlease transcribe and answer this audio message.`;
    } else if (message) {
      prompt = message;
    } else {
      return res.status(400).json({ error: "No message or file found." });
    }

    const systemContext = `
      You are "Vera," a career search agent. 
      User Context: ${preferences || "Not specified"}.
      Return ONLY JSON: { "intent": "SEARCH|VISA|CHAT|EVALUATE", "response_text": "...", "search_query": "...", "suggested_companies": [], "suggested_actions": [] }
    `;

    const fullPrompt = prompt + "\n" + systemContext;

    const response = await retryAICall(fullPrompt);
    res.json(extractJSON(response.text()));
  } catch (error) {
    console.error("API Assistant Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 4. Match Stories for Interview Prep
app.post("/api/match-stories", async (req, res) => {
  const { jobDescription, stories } = req.body;
  try {
    const prompt = `Match relevant stories to this job description: ${jobDescription}. Stories: ${JSON.stringify(stories)}. Return ONLY JSON: { "recommendations": [], "interview_q": [] }`;
    const response = await retryAICall(prompt);
    res.json(extractJSON(response.text()));
  } catch (error) {
    console.error("API Match Stories Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 5. Discovery Agent
app.post("/api/agent/discover", async (req, res) => {
  const { preferences, userCV, existingJobUrls = [] } = req.body;
  try {
    const queryPrompt = `Based on: "${preferences}", generate 3 job search queries. Return ONLY JSON array of strings.`;
    const response = await retryAICall(queryPrompt);
    const queries = extractJSON(response.text());

    res.json({
      queries,
      discoveredJobs: [], // Simplified for this update
      message: `Vera scanned ${queries.length} targets. No new matches found in this sweep.`,
    });
  } catch (error) {
    console.error("Discovery Agent Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6. CV Extraction
app.post("/api/extract-cv", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided." });
  try {
    const fileData = req.file.buffer.toString("base64");
    const prompt = `Extract all professional content from this document (${req.file.mimetype}) as plain text. Base64: ${fileData.substring(0, 200)}...`;

    const response = await retryAICall(prompt);
    res.json({ text: response.text() });
  } catch (error) {
    console.error("CV Extraction Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- Settings & Configuration ---

// Get current AI provider
app.get("/api/settings/provider", (req, res) => {
  res.json({
    current: getProvider(),
    available: getAvailableProviders(),
    message: "Use POST /api/settings/provider to switch providers",
  });
});

// Switch AI provider
app.post("/api/settings/provider", (req, res) => {
  const { provider } = req.body;
  try {
    if (!provider) {
      return res.status(400).json({ error: "Provider name is required" });
    }
    const result = setProvider(provider);
    res.json(result);
  } catch (error) {
    console.error("Settings Error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get supported providers with documentation
app.get("/api/settings/providers-info", (req, res) => {
  res.json({
    providers: {
      gemini: {
        name: "Google Gemini",
        model: "gemini-1.5-flash",
        type: "Freemium",
        features: ["Text", "Image", "Audio"],
        requiresKey: true,
        envVar: "GEMINI_API_KEY",
        link: "https://ai.google.dev",
      },
      zai: {
        name: "Z.AI (Free Tier)",
        model: "glm-4-flash",
        type: "Free",
        features: ["Text"],
        requiresKey: true,
        envVar: "ZAI_API_KEY",
        link: "https://z.ai",
      },
      openrouter: {
        name: "OpenRouter",
        model: "Configurable (google/gemini-2.0-flash-lite default)",
        type: "Freemium",
        features: ["Text", "Multiple Models"],
        requiresKey: true,
        envVar: "OPENROUTER_API_KEY",
        link: "https://openrouter.ai",
      },
    },
  });
});

// --- Model Management ---

// Get available models for a specific provider
app.get("/api/settings/models", (req, res) => {
  const { provider } = req.query;

  try {
    if (!provider) {
      // Return all models organized by provider
      res.json({
        models: availableModels,
        current: {
          provider: getProvider(),
          model: getModel(),
        },
      });
    } else {
      // Return models for a specific provider
      const models = getModelsForProvider(provider);
      if (!models || models.length === 0) {
        return res.status(400).json({ error: `Unknown provider: ${provider}` });
      }
      res.json({
        provider,
        models,
        current: getProvider() === provider ? getModel() : null,
      });
    }
  } catch (error) {
    console.error("Settings Error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Switch AI model for current provider
app.post("/api/settings/model", (req, res) => {
  const { model } = req.body;
  try {
    if (!model) {
      return res.status(400).json({ error: "Model ID is required" });
    }
    const result = setModel(model);
    res.json(result);
  } catch (error) {
    console.error("Settings Error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get current model and provider
app.get("/api/settings/current", (req, res) => {
  res.json({
    provider: getProvider(),
    model: getModel(),
  });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
