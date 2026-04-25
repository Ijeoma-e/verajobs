const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');
const axios = require('axios');
const multer = require('multer');
const upload = multer(); // Middleware for handling file uploads

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Helper: Scraper ---
async function scrapeJob(url) {
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
  });
  const $ = cheerio.load(data);

  let company = 'Unknown', title = 'Unknown', description = '';

  if (url.includes('greenhouse.io')) {
    company = $('div.header-container img').attr('alt') || 'Unknown';
    title = $('h1.app-title').text().trim();
    description = $('#content').text().trim();
  } else if (url.includes('lever.co')) {
    company = $('.posting-header h2').text().trim() || 'Unknown';
    title = $('.posting-header h2').text().trim();
    description = $('.section.page-centered').text().trim();
  } else {
    company = $('title').text().split('|')[0]?.trim();
    title = $('h1').first().text().trim() || $('title').text().trim();
    description = $('body').text().trim().substring(0, 5000);
  }

  return { company, title, description };
}

// --- Routes ---

app.post('/api/evaluate', async (req, res) => {
  const { url, userCV, preferences } = req.body;
  try {
    const jobData = await scrapeJob(url);
    const prompt = `Evaluate this job against CV: ${userCV} and Prefs: ${preferences}. Job: ${jobData.description}. Return JSON: { score, fit_summary, green_flags: [], red_flags: [], compensation_estimate, action_plan }`;
    const result = await model.generateContent(prompt);
    const jsonString = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    res.json({ ...jobData, evaluation: JSON.parse(jsonString) });
  } catch (error) { 
    console.error("API Evaluate Error:", error);
    res.status(500).json({ error: error.message }); 
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
    console.error("API Tailor Error:", error);
    res.status(500).json({ error: error.message }); 
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
      // Corrected typo and clarified prompt for audio
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
    // Gemini multimodal API expects an array of parts for content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: parts }],
    });
    const responseText = await result.response.text();
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    res.json(JSON.parse(jsonString));
  } catch (error) {
    console.Get a clearer log for debugging:
    console.error("API Assistant Error:", error.message); // Log only the message for brevity
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error Data:", error.response.data);
      console.error("Error Status:", error.response.status);
      console.error("Error Headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Error Request:", error.request);
    } else {
      // Something set up in the app that triggered an Error
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
    res.status(500).json({ error: error.message }); 
  }
});


app.listen(PORT, () => console.log(`Backend running on port \${PORT}`));
