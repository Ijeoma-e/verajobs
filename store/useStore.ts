import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  baseCV: string;
  preferences: string;
  aiSettings?: {
    isAutonomous: boolean;
    scanFrequency: 'daily' | 'weekly';
    autoTailor: boolean;
  };
}

interface Job {
  id: string;
  company: string;
  title: string;
  description: string;
  url: string;
  score: string;
  evaluation: any;
  status: 'applied' | 'interviewing' | 'rejected' | 'offered' | 'evaluating';
  createdAt: number;
  applicationDate?: number;
  notes?: string;
  contactPerson?: string;
}

interface DiscoveredJob {
  id: string;
  company: string;
  title: string;
  url: string;
  score: string;
  reason: string;
  isSeen: boolean;
  createdAt: number;
}

interface Story {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection: string;
  tags: string[];
}

interface AppState {
  user: UserProfile | null;
  jobs: Job[];
  stories: Story[];
  discoveredJobs: DiscoveredJob[];
  setUser: (user: UserProfile | null) => void;
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  removeJob: (id: string) => void;
  setStories: (stories: Story[]) => void;
  addStory: (story: Story) => void;
  setDiscoveredJobs: (jobs: DiscoveredJob[]) => void;
  markDiscoveredJobAsSeen: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      jobs: [],
      stories: [],
      discoveredJobs: [],
      setUser: (user) => set({ user }),
      setJobs: (jobs) => set({ jobs }),
      addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
      updateJob: (id, updates) =>
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
        })),
      removeJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== id),
        })),
      setStories: (stories) => set({ stories }),
      addStory: (story) => set((state) => ({ stories: [story, ...state.stories] })),
      setDiscoveredJobs: (jobs) => set({ discoveredJobs: jobs }),
      markDiscoveredJobAsSeen: (id) =>
        set((state) => ({
          discoveredJobs: state.discoveredJobs.map((j) =>
            j.id === id ? { ...j, isSeen: true } : j
          ),
        })),
    }),
    {
      name: 'verajobs-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
