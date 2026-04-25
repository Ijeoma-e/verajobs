const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');
const axios = require('axios');

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

// 1. Scrape and Evaluate
app.post('/api/evaluate', async (req, res) => {
  const { url, userCV, preferences } = req.body;
  try {
    const jobData = await scrapeJob(url);
    
    const prompt = `
      Evaluate this job against the CV and preferences.
      Job: \${jobData.description}
      CV: \${userCV}
      Prefs: \${preferences}
      Return JSON: { score, fit_summary, green_flags: [], red_flags: [], compensation_estimate, action_plan }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    res.json({
      ...jobData,
      evaluation: JSON.parse(jsonString)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Tailor CV
app.post('/api/tailor', async (req, res) => {
  const { jobDescription, userCV } = req.body;
  try {
    const prompt = `
      Tailor this CV for the job. 
      Job: \${jobDescription}
      CV: \${userCV}
      Return JSON: { personal_info: {name, email, phone}, summary, experience: [{role, company, duration, bullets: []}], skills: [] }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    res.json(JSON.parse(jsonString));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(\`Backend running on port \${PORT}\`));
