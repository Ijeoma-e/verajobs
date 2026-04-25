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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/tailor', async (req, res) => {
  const { jobDescription, userCV } = req.body;
  try {
    const prompt = `Tailor CV for Job: ${jobDescription}. CV: ${userCV}. Return JSON: { personal_info: {name, email, phone}, summary, experience: [{role, company, duration, bullets: []}], skills: [] }`;
    const result = await model.generateContent(prompt);
    const jsonString = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(jsonString));
  } catch (error) { res.status(500).json({ error: error.message }); }
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/assistant', upload.single('audio'), async (req, res) => {
  const { message, userProfile, preferences } = req.body;
  try {
    const parts = [];
    if (req.file) {
      parts.push({ inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString('base64') } });
      parts.push({ text: "Transcribe and analyze this audio." });
    } else {
      parts.push({ text: message });
    }

    const prompt = `
      You are "Vera," a career search agent. 
      Context: ${preferences}. 
      
      If the user wants to "find" or "discover" jobs:
      1. Provide a "Discovery Action Plan".
      2. List 5 top-tier companies currently hiring for this role with visa sponsorship (based on your knowledge).
      3. Generate a "Smart Search URL" for Google Jobs/LinkedIn.

      Return JSON: { 
        "intent": "SEARCH|VISA|CHAT", 
        "response_text": "...", 
        "search_query": "...",
        "suggested_companies": [{name, reason, strength}],
        "suggested_actions": [] 
      }
    `;
    parts.push({ text: prompt });
    const result = await model.generateContent(parts);
    const jsonString = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(jsonString));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
