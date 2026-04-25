const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cheerio = require("cheerio");
const axios = require("axios");
const multer = require("multer");
const upload = multer();

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "active", message: "AuraJobs API is running" });
});

const PORT = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// Check for API Key on startup
if (!process.env.GEMINI_API_KEY) {
  console.error(
    "CRITICAL: GEMINI_API_KEY is not set in environment variables.",
  );
} else {
  console.log("Gemini API Key detected, using model: gemini-1.5-flash");
}

// --- Helper: Scraper ---
async function scrapeJob(url) {
  try {
    if (!url || !url.startsWith("http")) {
      throw new Error("Invalid URL provided.");
    }
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 15000,
    });
    const $ = cheerio.load(data);

    let company = "Unknown",
      title = "Unknown",
      description = "";

    if (url.includes("greenhouse.io")) {
      company =
        $("div.header-container img").attr("alt") ||
        $('meta[property="og:site_name"]').attr("content") ||
        "Unknown Company";
      title =
        $("h1.app-title").text().trim() ||
        $('meta[property="og:title"]').attr("content") ||
        "Unknown Title";
      description =
        $("#content").text().trim() ||
        $('meta[property="og:description"]').attr("content") ||
        "";
    } else if (url.includes("lever.co")) {
      company =
        $(".posting-header h2").text().trim() ||
        $('meta[property="og:site_name"]').attr("content") ||
        "Unknown Company";
      title =
        $(".posting-header h2").text().trim() ||
        $('meta[property="og:title"]').attr("content") ||
        "Unknown Title";
      description =
        $(".section.page-centered").text().trim() ||
        $('meta[property="og:description"]').attr("content") ||
        "";
    } else if (url.includes("ashbyhq.com")) {
      company =
        $("title").text().split("|")[1]?.trim() ||
        $('meta[property="og:site_name"]').attr("content") ||
        "Unknown Company";
      title =
        $("h1").first().text().trim() ||
        $('meta[property="og:title"]').attr("content") ||
        "Unknown Title";
      description =
        $(".job-description").text().trim() ||
        $("main").text().trim() ||
        $('meta[property="og:description"]').attr("content") ||
        "";
    } else {
      company =
        $('meta[property="og:site_name"]').attr("content") ||
        $("title").text().split("|")[0]?.trim() ||
        "Unknown Company";
      title =
        $('meta[property="og:title"]').attr("content") ||
        $("h1").first().text().trim() ||
        $("title").text().trim() ||
        "Unknown Title";
      // More aggressive description extraction
      description =
        $('meta[property="og:description"]').attr("content") ||
        $("article").text().trim() ||
        $("main").text().trim() ||
        $(".job-description").text().trim() ||
        $(".description").text().trim() ||
        $("body").text().trim().substring(0, 5000);
    }

    if (!description || description.length < 100) {
      console.warn(`Scraping warning: Short description for ${url}.`);
    }

    return { company, title, description };
  } catch (error) {
    console.error(`Scraping Error for ${url}:`, error.message);
    throw new Error(`Failed to scrape job details: ${error.message}`);
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
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({
      ...jobData,
      evaluation: extractJSON(text),
    });
  } catch (error) {
    console.error("API Evaluate Error:", error.message);
    res.status(500).json({
      error:
        error.message || "An unexpected error occurred during job evaluation.",
    });
  }
});

app.post("/api/tailor", async (req, res) => {
  const { jobDescription, userCV } = req.body;
  try {
    const prompt = `Tailor CV for Job: ${jobDescription}. CV: ${userCV}. Return ONLY JSON: { "personal_info": {"name": "...", "email": "...", "phone": "..."}, "summary": "...", "experience": [{"role": "...", "company": "...", "duration": "...", "bullets": []}], "skills": [] }`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json(extractJSON(text));
  } catch (error) {
    console.error("API Tailor Error:", error.message);
    res.status(500).json({
      error:
        error.message || "An unexpected error occurred during CV tailoring.",
    });
  }
});

// 3. Assistant (Chat/Voice)
app.post("/api/assistant", upload.single("audio"), async (req, res) => {
  console.log("--- Assistant API Start ---");

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Server Configuration Error",
      details: "GEMINI_API_KEY is missing on the server.",
    });
  }

  console.log("Headers:", req.headers["content-type"]);
  console.log("BodyKeys:", Object.keys(req.body));
  console.log("HasFile:", !!req.file);

  const { message, userProfile, preferences } = req.body;
  try {
    const parts = [];

    if (req.file && req.file.buffer) {
      console.log("File detected, size:", req.file.buffer.length);
      parts.push({
        inlineData: {
          mimeType: req.file.mimetype || "audio/m4a",
          data: req.file.buffer.toString("base64"),
        },
      });
      parts.push({ text: "Please transcribe and answer this audio message." });
    } else if (message) {
      console.log("Message detected:", message);
      parts.push({ text: message });
    } else {
      console.warn("No message or file found in request");
      return res
        .status(400)
        .json({ error: "Either text message or audio file must be provided." });
    }

    const systemContext = `
      You are "Vera," a pro-active career search agent. 
      User Context: ${preferences || "Not specified"}.
      UserProfile: ${userProfile || "Not provided"}.
      
      Task: Analyze the user's message (text or audio).
      
      Intent Detection:
      - "SEARCH": Find new jobs. Provide a specific search query for Google/LinkedIn.
      - "VISA": Specifically looking for sponsorship/relocation.
      - "EVALUATE": Wants to check a specific role.
      
      Return ONLY JSON: 
      { 
        "intent": "SEARCH|VISA|CHAT|EVALUATE", 
        "response_text": "...", 
        "search_query": "...", 
        "suggested_companies": [{"name": "...", "reason": "...", "strength": "..."}], 
        "suggested_actions": [] 
      }
    `;

    parts.push({ text: systemContext });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: parts }],
    });

    const response = await result.response;
    const responseText = response.text();
    console.log("Gemini Raw Response:", responseText);

    const data = extractJSON(responseText);
    res.json(data);
  } catch (error) {
    console.error("API Assistant Error Details:", error);
    res.status(500).json({
      error: "An unexpected error occurred on the server.",
      details: error.message,
    });
  }
});

// 4. Match Stories for Interview Prep
app.post("/api/match-stories", async (req, res) => {
  const { jobDescription, stories } = req.body;
  try {
    const prompt = `
      Job Description: ${jobDescription}
      User's STAR+R Stories: ${JSON.stringify(stories)}
      
      Match the most relevant stories to this job. Return ONLY JSON: { "recommendations": [{"storyId": "...", "reason": "..."}], "interview_q": [{"question": "...", "recommendedStoryId": "..."}] }
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json(extractJSON(text));
  } catch (error) {
    console.error("API Match Stories Error:", error.message);
    res.status(500).json({
      error:
        error.message || "An unexpected error occurred during story matching.",
    });
  }
});

app.listen(PORT, () => console.log(`Backend running on port \${PORT}`));
