const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');
const axios = require('axios');
const multer = require('multer');
const upload = multer();

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'active', message: 'AuraJobs API is running' });
});

const PORT = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// Check for API Key on startup
if (!process.env.GEMINI_API_KEY) {
  console.error("CRITICAL: GEMINI_API_KEY is not set in environment variables.");
} else {
  console.log("Gemini API Key detected, using model: gemini-3-flash-preview");
}

// --- Helper: Scraper (Superpowered) ---
async function scrapeJob(url) {
  try {
    if (!url || !url.startsWith("http")) {
      throw new Error("Invalid URL provided.");
    }
    
    console.log(`Scraping URL: ${url}`);
    
    const { data } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 20000
    });
    
    const $ = cheerio.load(data);
    
    // Remove scripts, styles and other noise to save tokens
    $('script, style, svg, nav, footer, iframe').remove();

    let company = 'Unknown', title = 'Unknown', description = '';

    // Strategy 1: Specific Selectors
    if (url.includes('greenhouse.io')) {
      company = $('div.header-container img').attr('alt') || $('meta[property="og:site_name"]').attr('content');
      title = $('h1.app-title').text().trim();
      description = $('#content').text().trim();
    } else if (url.includes('lever.co')) {
      company = $('meta[property="og:site_name"]').attr('content') || $('.posting-header h2').text().trim();
      title = $('.posting-header h2').text().trim();
      description = $('.section.page-centered').text().trim();
    }

    // Strategy 2: Agentic Extraction Fallback
    // If we didn't get a good description, ask Gemini to find it in the raw text
    if (!description || description.length < 200) {
      console.log("Standard scraping limited. Engaging Agentic Extraction...");
      const rawText = $('body').text().substring(0, 10000).replace(/\s+/g, ' ');
      
      const extractionPrompt = `
        I am a job scraper. I have the following raw text from a webpage: "${url}".
        Raw Text: ${rawText}
        
        Extract the:
        1. Company Name
        2. Job Title
        3. Full Job Description
        
        Return ONLY JSON: { "company": "...", "title": "...", "description": "..." }
      `;
      
      const result = await model.generateContent(extractionPrompt);
      const extracted = extractJSON(result.response.text());
      
      company = extracted.company || company;
      title = extracted.title || title;
      description = extracted.description || description;
    }
    
    return { 
      company: company || "Unknown Company", 
      title: title || "Job Position", 
      description: description || "" 
    };
  } catch (error) {
    console.error(`Scraping Error for ${url}:`, error.message);
    throw new Error(`Failed to access the job page. The site might be blocking us or requires JS.`);
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

app.post('/api/evaluate', async (req, res) => {
  const { url, userCV, preferences } = req.body;
  try {
    if (!url) return res.status(400).json({ error: "URL is required." });
    
    const jobData = await scrapeJob(url);
    
    if (!jobData.description || jobData.description.length < 50) {
        return res.status(400).json({ error: "Could not extract job description from the provided URL. The site may be blocking automated access." });
    }

    const prompt = `Evaluate this job against CV: ${userCV} and Prefs: ${preferences}. Job: ${jobData.description}. Return ONLY JSON: { "score": "A|B|C|D", "fit_summary": "...", "green_flags": [], "red_flags": [], "compensation_estimate": "...", "action_plan": "..." }`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    res.json({
      ...jobData,
      evaluation: extractJSON(text)
    });
  } catch (error) { 
    console.error("API Evaluate Error:", error.message);
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/tailor', async (req, res) => {
  const { jobDescription, userCV } = req.body;
  try {
    const prompt = `Tailor CV for Job: ${jobDescription}. CV: ${userCV}. Return ONLY JSON: { "personal_info": {"name": "...", "email": "...", "phone": "..."}, "summary": "...", "experience": [{"role": "...", "company": "...", "duration": "...", "bullets": []}], "skills": [] }`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json(extractJSON(text));
  } catch (error) { 
    console.error("API Tailor Error:", error.message);
    res.status(500).json({ error: error.message }); 
  }
});

// 3. Assistant (Chat/Voice)
app.post('/api/assistant', upload.single('audio'), async (req, res) => {
  console.log("--- Assistant API Start ---");
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: "Server Configuration Error", 
      details: "GEMINI_API_KEY is missing on the server." 
    });
  }

  console.log("Headers:", req.headers['content-type']);
  console.log("BodyKeys:", Object.keys(req.body));
  console.log("HasFile:", !!req.file);

  const { message, userProfile, preferences } = req.body;
  try {
    const parts = [];
    
    if (req.file && req.file.buffer) {
      console.log("File detected, size:", req.file.buffer.length);
      parts.push({
        inlineData: {
          mimeType: req.file.mimetype || 'audio/m4a',
          data: req.file.buffer.toString('base64')
        }
      });
      parts.push({ text: "Please transcribe and answer this audio message." });
    } else if (message) {
      console.log("Message detected:", message);
      parts.push({ text: message });
    } else {
      console.warn("No message or file found in request");
      return res.status(400).json({ error: "Either text message or audio file must be provided." });
    }

    const systemContext = `
      You are "Vera," a pro-active career search agent. 
      User Context: ${preferences || 'Not specified'}.
      UserProfile: ${userProfile || 'Not provided'}.
      
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
      details: error.message 
    }); 
  }
});

// 4. Match Stories for Interview Prep
app.post('/api/match-stories', async (req, res) => {
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
    res.status(500).json({ error: error.message || "An unexpected error occurred during story matching." }); 
  }
});

// 5. Discovery Agent (Autonomous Search)
app.post('/api/agent/discover', async (req, res) => {
  const { preferences, userCV, existingJobUrls = [] } = req.body;
  console.log("--- Discovery Agent Start ---");
  
  try {
    // 1. Generate Search Queries based on preferences
    const queryPrompt = `
      Based on these career preferences: "${preferences}", 
      generate 3 highly specific Google search queries to find job postings on Greenhouse, Lever, or Ashby.
      Example: site:lever.co "Senior AI Engineer" "Remote"
      Return ONLY a JSON array of strings: ["query1", "query2", "query3"]
    `;
    const queryResult = await model.generateContent(queryPrompt);
    const queries = extractJSON(queryResult.response.text());
    console.log("Generated Queries:", queries);

    // 2. Simulate Discovery (In a real app, this would use a Search API like Serper or Scraper)
    // For this prototype, we'll simulate finding 3 relevant URLs for the queries
    const discoveredUrls = [
      "https://jobs.lever.co/example/1",
      "https://boards.greenhouse.io/example/2",
      "https://jobs.ashbyhq.com/example/3"
    ].filter(url => !existingJobUrls.includes(url));

    // 3. Evaluate each discovered job (Mocking the results for speed in this demo)
    // In production, this would call scrapeJob(url) and evaluateJob logic for each
    const results = [
      {
        id: Math.random().toString(36).substring(7),
        company: "Vercel",
        title: "Senior Frontend Engineer",
        url: "https://jobs.lever.co/vercel/1",
        score: "A",
        reason: "Perfect match for your React expertise and desire for remote work.",
        isSeen: false,
        createdAt: Date.now()
      },
      {
        id: Math.random().toString(36).substring(7),
        company: "Anthropic",
        title: "AI Safety Researcher",
        url: "https://jobs.lever.co/anthropic/2",
        score: "B",
        reason: "Strong fit for your Python skills, though requires relocation to SF.",
        isSeen: false,
        createdAt: Date.now()
      }
    ];

    res.json({ 
      queries,
      discoveredJobs: results,
      message: `Vera scanned ${queries.length} targets and found ${results.length} high-fit roles.`
    });

  } catch (error) {
    console.error("Discovery Agent Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6. CV Extraction (Multimodal)
app.post('/api/extract-cv', upload.single('file'), async (req, res) => {
  console.log("--- CV Extraction Start ---");
  
  if (!req.file) {
    return res.status(400).json({ error: "No file provided." });
  }

  try {
    const prompt = "Please extract the full professional content from this document. Maintain the structure of experience, skills, and contact info. Return only the extracted text.";
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString('base64')
        }
      },
      { text: prompt }
    ]);

    const response = await result.response;
    const text = response.text();
    
    res.json({ text });
  } catch (error) {
    console.error("CV Extraction Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
