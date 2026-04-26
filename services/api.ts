import { Platform } from "react-native";

const getBackendUrl = () => {
  let url = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000";

  // Android emulator fallback
  if (
    Platform.OS === "android" &&
    (url.includes("localhost") || url.includes("127.0.0.1"))
  ) {
    url = url.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
  }
  return url;
};

const BACKEND_URL = getBackendUrl();
console.log("Using BACKEND_URL:", BACKEND_URL);

// Helper for standard JSON POST requests
const postJSON = async (endpoint: string, data: any) => {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.details
        ? `${errorData.error}: ${errorData.details}`
        : errorData.error || `Server responded with ${response.status}`;
      throw new Error(msg);
    }
    return response.json();
  } catch (error: any) {
    console.error(`Fetch Error [${endpoint}]:`, error);
    throw new Error(`Connection failed: ${error.message}`);
  }
};

export const evaluateJob = async (
  url: string,
  userCV: string,
  preferences: string,
) => {
  return postJSON("/api/evaluate", { url, userCV, preferences });
};

export const getTailoredCV = async (jobDescription: string, userCV: string) => {
  return postJSON("/api/tailor", { jobDescription, userCV });
};

export const getTailoredCoverLetter = async (jobDescription: string, userCV: string, companyName: string, jobTitle: string) => {
  return postJSON("/api/tailor-cover-letter", { jobDescription, userCV, companyName, jobTitle });
};

export const askAssistant = async (
  message: string | null,
  audioUri: string | null,
  userProfile: any,
  preferences: string,
) => {
  const formData = new FormData();

  if (message) formData.append("message", message);
  if (preferences) formData.append("preferences", preferences);

  if (userProfile) {
    const profileStr =
      typeof userProfile === "object"
        ? JSON.stringify(userProfile)
        : userProfile;
    formData.append("userProfile", profileStr);
  }

  if (audioUri) {
    const filename = audioUri.split("/").pop() || "recording.m4a";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `audio/${match[1]}` : `audio/m4a`;

    // @ts-ignore
    formData.append("audio", {
      uri: audioUri,
      name: filename,
      type: type,
    });
  }

  const response = await fetch(`${BACKEND_URL}/api/assistant`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.details
      ? `${errorData.error}: ${errorData.details}`
      : errorData.error || `Server responded with ${response.status}`;
    throw new Error(msg);
  }
  return response.json();
};

export const matchStories = async (jobDescription: string, stories: any[]) => {
  return postJSON("/api/match-stories", { jobDescription, stories });
};

export const discoverJobs = async (
  preferences: string,
  userCV: string,
  existingUrls: string[],
) => {
  return postJSON("/api/agent/discover", { preferences, userCV, existingUrls });
};

export const extractTextFromPDF = async (
  uri: string,
  name: string,
  type: string,
) => {
  const formData = new FormData();
  // @ts-ignore
  formData.append("file", { uri, name, type });

  const response = await fetch(`${BACKEND_URL}/api/extract-cv`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Server responded with ${response.status}`,
    );
  }
  const result = await response.json();
  return result.text;
};

// --- AI Provider Settings ---
export const getCurrentProvider = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/settings/provider`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    return response.json();
  } catch (error: any) {
    console.error("Failed to fetch current provider:", error);
    throw new Error(`Failed to fetch provider settings: ${error.message}`);
  }
};

export const switchAIProvider = async (provider: string) => {
  return postJSON("/api/settings/provider", { provider });
};

export const getProvidersInfo = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/settings/providers-info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    return response.json();
  } catch (error: any) {
    console.error("Failed to fetch providers info:", error);
    throw new Error(`Failed to fetch providers info: ${error.message}`);
  }
};

// --- AI Model Settings ---
export const getAvailableModels = async (provider?: string) => {
  try {
    const url = provider
      ? `${BACKEND_URL}/api/settings/models?provider=${provider}`
      : `${BACKEND_URL}/api/settings/models`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    return response.json();
  } catch (error: any) {
    console.error("Failed to fetch models:", error);
    throw new Error(`Failed to fetch models: ${error.message}`);
  }
};

export const switchAIModel = async (model: string) => {
  return postJSON("/api/settings/model", { model });
};

export const getCurrentSettings = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/settings/current`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    return response.json();
  } catch (error: any) {
    console.error("Failed to fetch current settings:", error);
    throw new Error(`Failed to fetch current settings: ${error.message}`);
  }
};

export default {
  evaluateJob,
  getTailoredCV,
  getTailoredCoverLetter,
  askAssistant,
  matchStories,
  discoverJobs,
  extractTextFromPDF,
  getCurrentProvider,
  switchAIProvider,
  getProvidersInfo,
  getAvailableModels,
  switchAIModel,
  getCurrentSettings,
};
