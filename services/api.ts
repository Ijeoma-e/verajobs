import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 60000, 
});

export const evaluateJob = async (url: string, userCV: string, preferences: string) => {
  const response = await api.post('/api/evaluate', { url, userCV, preferences });
  return response.data;
};

export const getTailoredCV = async (jobDescription: string, userCV: string) => {
  const response = await api.post('/api/tailor', { jobDescription, userCV });
  return response.data;
};

export const askAssistant = async (message: string | null, audioUri: string | null, userProfile: any, preferences: string) => {
  const formData = new FormData();
  
  if (message) formData.append('message', message);
  if (preferences) formData.append('preferences', preferences);
  if (userProfile) formData.append('userProfile', JSON.stringify(userProfile));
  
  if (audioUri) {
    const filename = audioUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `audio/${match[1]}` : `audio/m4a`;
    
    // @ts-ignore
    formData.append('audio', {
      uri: audioUri,
      name: filename,
      type: type,
    });
  }

  const response = await api.post('/api/assistant', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const matchStories = async (jobDescription: string, stories: any[]) => {
  const response = await api.post('/api/match-stories', { jobDescription, stories });
  return response.data;
};

export default api;
