import { Platform } from 'react-native';

const getBackendUrl = () => {
  let url = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  
  // Android emulator fallback
  if (Platform.OS === 'android' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    url = url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return url;
};

const BACKEND_URL = getBackendUrl();
console.log("Using BACKEND_URL:", BACKEND_URL);

// Helper for standard JSON POST requests
const postJSON = async (endpoint: string, data: any) => {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.details 
        ? `${errorData.error}: ${errorData.details}` 
        : (errorData.error || `Server responded with ${response.status}`);
      throw new Error(msg);
    }
    return response.json();
  } catch (error: any) {
    console.error(`Fetch Error [${endpoint}]:`, error);
    throw new Error(`Connection failed: ${error.message}`);
  }
};

export const evaluateJob = async (url: string, userCV: string, preferences: string) => {
  return postJSON('/api/evaluate', { url, userCV, preferences });
};

export const getTailoredCV = async (jobDescription: string, userCV: string) => {
  return postJSON('/api/tailor', { jobDescription, userCV });
};

export const askAssistant = async (message: string | null, audioUri: string | null, userProfile: any, preferences: string) => {
  const formData = new FormData();
  
  if (message) formData.append('message', message);
  if (preferences) formData.append('preferences', preferences);
  
  if (userProfile) {
    const profileStr = typeof userProfile === 'object' ? JSON.stringify(userProfile) : userProfile;
    formData.append('userProfile', profileStr);
  }
  
  if (audioUri) {
    const filename = audioUri.split('/').pop() || 'recording.m4a';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `audio/${match[1]}` : `audio/m4a`;
    
    // @ts-ignore
    formData.append('audio', {
      uri: audioUri,
      name: filename,
      type: type,
    });
  }

  const response = await fetch(`${BACKEND_URL}/api/assistant`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.details 
      ? `${errorData.error}: ${errorData.details}` 
      : (errorData.error || `Server responded with ${response.status}`);
    throw new Error(msg);
  }  return response.json();
};

export const matchStories = async (jobDescription: string, stories: any[]) => {
  return postJSON('/api/match-stories', { jobDescription, stories });
};

export default { evaluateJob, getTailoredCV, askAssistant, matchStories };
