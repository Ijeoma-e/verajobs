import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000, // Gemini can be slow
});

export const evaluateJob = async (url: string, userCV: string, preferences: string) => {
  const response = await api.post('/api/evaluate', { url, userCV, preferences });
  return response.data;
};

export const getTailoredCV = async (jobDescription: string, userCV: string) => {
  const response = await api.post('/api/tailor', { jobDescription, userCV });
  return response.data;
};

export default api;
