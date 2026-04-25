const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Store current provider and model configuration
let currentProvider = process.env.AI_PROVIDER || "gemini";
let currentModel = process.env.AI_MODEL;

// Available models per provider
const availableModels = {
  gemini: [
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      speed: "Fast",
      type: "Free",
    },
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      speed: "Balanced",
      type: "Premium",
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      speed: "Very Fast",
      type: "Free",
    },
  ],
  zai: [
    {
      id: "glm-4-flash",
      name: "GLM-4-Flash",
      speed: "Very Fast",
      type: "Free",
    },
    {
      id: "glm-4.7-flash",
      name: "GLM-4.7-Flash",
      speed: "Very Fast",
      type: "Free",
    },
    { id: "glm-4.5-flash", name: "GLM-4.5-Flash", speed: "Fast", type: "Free" },
  ],
  openrouter: [
    {
      id: "google/gemini-2.0-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      speed: "Fast",
      type: "Free",
    },
    {
      id: "meta-llama/llama-3-70b-instruct",
      name: "Llama 3 70B",
      speed: "Balanced",
      type: "Free",
    },
    {
      id: "mistralai/mistral-7b-instruct",
      name: "Mistral 7B",
      speed: "Very Fast",
      type: "Free",
    },
    {
      id: "nvidia/nemotron-3-super-120b-a12b:free",
      name: "NVIDIA Nemotron 3 Super 120B",
      speed: "Balanced",
      type: "Free",
    },
  ],
};

// Provider configuration with default models
let providerConfig = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.AI_MODEL || "gemini-1.5-flash",
  },
  zai: {
    apiKey: process.env.ZAI_API_KEY,
    model: process.env.AI_MODEL || "glm-4-flash",
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.AI_MODEL || "google/gemini-2.0-flash-lite",
  },
};

let geminiClient = null;

// Initialize Gemini client
function initGemini() {
  if (providerConfig.gemini.apiKey) {
    geminiClient = new GoogleGenerativeAI(providerConfig.gemini.apiKey);
  }
}

// Call z.ai API
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
  console.log(
    `[AI Provider] Using: ${provider} (Model: ${providerConfig[provider].model})`,
  );

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

// Set model for current provider
function setModel(modelId) {
  const validModels = availableModels[currentProvider];
  if (!validModels) {
    throw new Error(`No models available for provider: ${currentProvider}`);
  }

  const model = validModels.find((m) => m.id === modelId);
  if (!model) {
    throw new Error(
      `Invalid model "${modelId}" for ${currentProvider}. Available: ${validModels.map((m) => m.id).join(", ")}`,
    );
  }

  providerConfig[currentProvider].model = modelId;
  currentModel = modelId;
  console.log(`[AI Model] Switched to: ${modelId}`);
  return { model: modelId, message: `Switched to ${model.name}` };
}

// Get current provider
function getProvider() {
  return currentProvider;
}

// Get current model
function getModel() {
  return providerConfig[currentProvider].model;
}

// Get available providers
function getAvailableProviders() {
  const available = {};
  if (providerConfig.gemini.apiKey) available.gemini = true;
  if (providerConfig.zai.apiKey) available.zai = true;
  if (providerConfig.openrouter.apiKey) available.openrouter = true;
  return available;
}

// Get available models for a provider
function getModelsForProvider(provider) {
  return availableModels[provider] || [];
}

// Initialize on load
initGemini();

// Set initial model if provided
if (currentModel) {
  try {
    // Validate and set the model for the current provider
    const models = getModelsForProvider(currentProvider);
    if (models.find((m) => m.id === currentModel)) {
      providerConfig[currentProvider].model = currentModel;
    }
  } catch (e) {
    console.warn(`Could not set initial model: ${e.message}`);
  }
}

// Check API keys on startup
console.log("\n--- AI Provider Configuration ---");
console.log(`Current Provider: ${currentProvider}`);
console.log(`Current Model: ${providerConfig[currentProvider].model}`);
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
  setModel,
  getProvider,
  getModel,
  getAvailableProviders,
  getModelsForProvider,
  availableModels,
  callGemini,
  callZAI,
  callOpenRouter,
};
