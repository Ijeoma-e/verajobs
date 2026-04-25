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

const PORT = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Helper: Scraper ---
async function scrapeJob(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9' // Added Accept-Language header
      },
      timeout: 15000 // Increased timeout for scraping requests
    });
    const $ = cheerio.load(data);

    let company = 'Unknown', title = 'Unknown', description = '';

    if (url.includes('greenhouse.io')) {
      company = $('div.header-container img').attr('alt') || $('meta[property="og:site_name"]').attr('content') || 'Unknown Company';
      title = $('h1.app-title').text().trim() || $('meta[property="og:title"]').attr('content') || 'Unknown Title';
      description = $('#content').text().trim() || $('meta[property="og:description"]').attr('content') || '';
    } else if (url.includes('lever.co')) {
      company = $('.posting-header h2').text().trim() || $('meta[property="og:site_name"]').attr('content') || 'Unknown Company';
      title = $('.posting-header h2').text().trim() || $('meta[property="og:title"]').attr('content') || 'Unknown Title';
      description = $('.section.page-centered').text().trim() || $('meta[property="og:description"]').attr('content') || '';
    } else if (url.includes('ashbyhq.com')) {
      company = $('title').text().split('|')[1]?.trim() || $('meta[property="og:site_name"]').attr('content') || 'Unknown Company';
      title = $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content') || 'Unknown Title';
      description = $('.job-description').text().trim() || $('main').text().trim() || $('meta[property="og:description"]').attr('content') || '';
    } else {
      // Generic fallback, trying to get Open Graph tags if available
      company = $('meta[property="og:site_name"]').attr('content') || $('title').text().split('|')[0]?.trim() || 'Unknown Company';
      title = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim() || $('title').text().trim() || 'Unknown Title';
      description = $('meta[property="og:description"]').attr('content') || $('body').text().trim().substring(0, 5000);
    }
    
    // Basic check for empty description which might indicate a block or failed scrape
    if (!description || description.length < 100) {
        console.warn(`Scraping warning: Short description for ${url}. Might be blocked or incomplete.`);
        // Optionally, could throw an error here if a very short description is critical
        // throw new Error("Scraping failed: Description too short, possibly blocked.");
    }

    return { company, title, description };
  } catch (error) {
    console.error(`Scraping Error for ${url}:`, error.message);
    // Throw an error that the API route can catch and handle
    throw new Error(`Failed to scrape job details from ${url}. Possible reason: ${error.message}`);
  }
}

// --- Routes ---

app.post('/api/evaluate', async (req, res) => {
  const { url, userCV, preferences } = req.body;
  try {
    const jobData = await scrapeJob(url);
    
    // Check if scraping returned meaningful data
    if (!jobData || !jobData.description || jobData.description.length < 100) {
        return res.status(400).json({ error: "Failed to retrieve job description. The site might be blocking scraping or the URL is invalid." });
    }

    const prompt = `Evaluate this job against CV: ${userCV} and Prefs: ${preferences}. Job: ${jobData.description}. Return JSON: { score, fit_summary, green_flags: [], red_flags: [], compensation_estimate, action_plan }`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    res.json({
      ...jobData,
      evaluation: JSON.parse(jsonString)
    });
  } catch (error) { 
    console.error("API Evaluate Error:", error.message);
    res.status(500).json({ error: error.message || "An unexpected error occurred during job evaluation." }); 
  }
});

app.post('/api/tailor', async (req, res) => {
  const { jobDescription, userCV } = req.body;
  try {
    const prompt = `Tailor CV for Job: ${jobDescription}. CV: ${userCV}. Return JSON: { personal_info: {name, email, phone}, summary, experience: [{role, company, duration, bullets: []}], skills: [] }`;
    const result = await model.generateContent(prompt);
    const jsonString = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(jsonString));
  } catch (error) { 
    console.error("API Tailor Error:", error.message);
    res.status(500).json({ error: error.message || "An unexpected error occurred during CV tailoring." }); 
  }
});

// 3. Assistant (Chat/Voice)
app.post('/api/assistant', upload.single('audio'), async (req, res) => {
  const { message, userProfile, preferences } = req.body;
  try {
    const parts = [];
    
    if (req.file) {
      parts.push({
        inlineData: {
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString('base64')
        }
      });
      parts.push({ text: "Please transcribe the audio above and treat it as the user's primary message." });
    } else if (message) {
      parts.push({ text: message });
    } else {
      return res.status(400).json({ error: "Either text message or audio file must be provided." });
    }

    const prompt = `
      You are "Vera," a pro-active career search agent. 
      Context: User wants roles like ${preferences}. 
      Task: Analyze the user's message (text or audio).
      
      Intent Detection:
      - "SEARCH": Find new jobs. Provide a specific search query for Google/LinkedIn.
      - "VISA": Specifically looking for sponsorship/relocation.
      - "EVALUATE": Wants to check a specific role.
      
      Special Mandate: If the user mentions "Visa" or "Sponsorship," ensure the search_query includes terms like 'visa sponsorship' or 'H1B'.

      Return ONLY JSON: { "intent": "SEARCH|VISA|CHAT", "response_text": "...", "search_query": "...", "suggested_companies": [{name, reason, strength}], "suggested_actions": [] }
    `;
    const result = await model.generateContent({
      contents: [{ role: "user", parts: parts }],
    });
    const responseText = await result.response.text();
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    res.json(JSON.parse(jsonString));
  } catch (error) {
    console.error("API Assistant Error:", error.message);
    if (error.response) {
      console.error("Error Data:", error.response.data);
      console.error("Error Status:", error.response.status);
      console.error("Error Headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error Request:", error.request);
    } else {
      console.error("Error Message:", error.message);
    }
    res.status(500).json({ error: error.message || "An unexpected error occurred on the server." }); 
  }
});

// 4. Match Stories for Interview Prep
app.post('/api/match-stories', async (req, res) => {
  const { jobDescription, stories } = req.body;
  try {
    const prompt = `
      Job Description: ${jobDescription}
      User's STAR+R Stories: ${JSON.stringify(stories)}
      
      Match the most relevant stories to this job. For each match, explain WHY it's relevant to this specific role.
      Also suggest 3 likely behavioral interview questions this job might ask and which story to use.

      Return JSON: { recommendations: [{storyId, reason}], interview_q: [{question, recommendedStoryId}] }
    `;
    const result = await model.generateContent(prompt);
    const jsonString = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(jsonString));
  } catch (error) { 
    console.error("API Match Stories Error:", error.message);
    res.status(500).json({ error: error.message || "An unexpected error occurred during story matching." }); 
  }
});

app.listen(PORT, () => console.log(`Backend running on port \${PORT}`));
