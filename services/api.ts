import axios from 'axios';
import { Platform } from 'react-native';

const getBackendUrl = () => {
  let url = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  
  // Android emulator uses 10.0.2.2 to access localhost of the host machine
  if (Platform.OS === 'android' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    url = url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return url;
};

const BACKEND_URL = getBackendUrl();

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
  if (userProfile) formData.append('userProfile', typeof userProfile === 'string' ? userProfile : JSON.stringify(userProfile));
  
  if (audioUri) {
    const filename = audioUri.split('/').pop() || 'recording.m4a';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `audio/${match[1]}` : `audio/m4a`;
    
    // In React Native, this is the standard way to append a file to FormData
    const audioFile = {
      uri: audioUri,
      name: filename,
      type: type,
    } as any;
    
    formData.append('audio', audioFile);
  }

  // Use a lower-level fetch or ensure axios handles this correctly without explicit headers
  const response = await api.post('/api/assistant', formData, {
    transformRequest: (data) => data, // Prevent axios from trying to serialize FormData
  });
  return response.data;
};

export const matchStories = async (jobDescription: string, stories: any[]) => {
  const response = await api.post('/api/match-stories', { jobDescription, stories });
  return response.data;
};

export default api;
