const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Store current provider configuration
let currentProvider = process.env.AI_PROVIDER || "gemini";
let providerConfig = {
  gemini: { apiKey: process.env.GEMINI_API_KEY, model: "gemini-1.5-flash" },
  zai: { apiKey: process.env.ZAI_API_KEY, model: "glm-4-flash" },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-lite",
  },
};

let geminiClient = null;

// Initialize Gemini client
function initGemini() {
  if (providerConfig.gemini.apiKey) {
    geminiClient = new GoogleGenerativeAI(providerConfig.gemini.apiKey);
  }
}

// Call z.ai API (GLM-4-Flash)
async function callZAI(prompt, retries = 3) {
  if (!providerConfig.zai.apiKey) {
    throw new Error("ZAI_API_KEY not configured");
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(
        "https://api.z.ai/v1/chat/completions",
        {
          model: providerConfig.zai.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${providerConfig.zai.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      return { text: () => response.data.choices[0].message.content };
    } catch (error) {
      if (
        (error.response?.status === 503 || error.code === "ECONNREFUSED") &&
        attempt < retries - 1
      ) {
        console.warn(
          `ZAI Error (attempt ${attempt + 1}/${retries}). Retrying...`,
        );
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
}

// Call OpenRouter API
async function callOpenRouter(prompt, retries = 3) {
  if (!providerConfig.openrouter.apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: providerConfig.openrouter.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${providerConfig.openrouter.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://verajobs.com",
            "X-Title": "VeraJobs",
          },
          timeout: 30000,
        },
      );

      return { text: () => response.data.choices[0].message.content };
    } catch (error) {
      if (
        (error.response?.status === 503 || error.code === "ECONNREFUSED") &&
        attempt < retries - 1
      ) {
        console.warn(
          `OpenRouter Error (attempt ${attempt + 1}/${retries}). Retrying...`,
        );
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
}

// Call Gemini API with retry
async function callGemini(promptOrParts, retries = 3) {
  if (!geminiClient) {
    throw new Error(
      "Gemini client not initialized. GEMINI_API_KEY may not be set.",
    );
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const model = geminiClient.getGenerativeModel({
        model: providerConfig.gemini.model,
      });
      const result = await model.generateContent(promptOrParts);
      return await result.response;
    } catch (error) {
      if (
        (error.message.includes("503") || error.message.includes("429")) &&
        attempt < retries - 1
      ) {
        console.warn(
          `Gemini Error (attempt ${attempt + 1}/${retries}). Retrying...`,
        );
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
}

// Main function: Route to appropriate provider
async function generateAIResponse(prompt, promptConfig = null) {
  const provider = currentProvider;
  console.log(`[AI Provider] Using: ${provider}`);

  if (provider === "zai") {
    return callZAI(prompt);
  } else if (provider === "openrouter") {
    return callOpenRouter(prompt);
  } else {
    return callGemini(promptConfig || prompt);
  }
}

// Switch provider
function setProvider(providerName) {
  const validProviders = ["gemini", "zai", "openrouter"];
  if (!validProviders.includes(providerName)) {
    throw new Error(
      `Invalid provider. Choose from: ${validProviders.join(", ")}`,
    );
  }
  currentProvider = providerName;
  console.log(`[AI Provider] Switched to: ${providerName}`);
  return { provider: providerName, message: `Switched to ${providerName}` };
}

// Get current provider
function getProvider() {
  return currentProvider;
}

// Get available providers
function getAvailableProviders() {
  const available = {};
  if (providerConfig.gemini.apiKey) available.gemini = true;
  if (providerConfig.zai.apiKey) available.zai = true;
  if (providerConfig.openrouter.apiKey) available.openrouter = true;
  return available;
}

// Initialize on load
initGemini();

// Check API keys on startup
console.log("\n--- AI Provider Configuration ---");
console.log(`Current Provider: ${currentProvider}`);
console.log(`Available Providers:`);
console.log(
  `  - Gemini: ${providerConfig.gemini.apiKey ? "✓ Configured" : "✗ Not configured"}`,
);
console.log(
  `  - Z.AI: ${providerConfig.zai.apiKey ? "✓ Configured" : "✗ Not configured"}`,
);
console.log(
  `  - OpenRouter: ${providerConfig.openrouter.apiKey ? "✓ Configured" : "✗ Not configured"}`,
);
console.log("--------------------------------\n");

module.exports = {
  generateAIResponse,
  setProvider,
  getProvider,
  getAvailableProviders,
  callGemini,
  callZAI,
  callOpenRouter,
};
