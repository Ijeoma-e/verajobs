# AGENTS.md - AuraJobs (verajobs)

## Project Overview
AuraJobs is an AI-powered job search command center that acts as a "career co-pilot." It automates job discovery, evaluation, and application tracking using Google Gemini AI.

## Architecture
- **Frontend**: React Native (Expo) + Expo Router + React Native Paper
- **Backend**: Node.js/Express with multi-AI provider support (Gemini, Z.AI, OpenRouter)
- **Database**: Firebase (Firestore, Auth, Storage) - Spark Plan
- **Deployment**: Firebase Hosting (web) + Vercel (API)
- **State Management**: Zustand

## Key Commands

### Development
```bash
# Mobile app development
npm start          # Start Expo development server
npm run android     # Android emulator
npm run ios         # iOS simulator
npm run web         # Web development server

# Web deployment
npm run build:web   # Build web version
npm run deploy:web  # Deploy to Firebase Hosting
```

### Backend
```bash
cd backend
npm install         # Install dependencies
npm start          # Start Express server (port 3000)
```

## Critical Environment Variables
Copy `.env.example` to `.env` and fill:
- Firebase config (Spark Plan)
- `EXPO_PUBLIC_GEMINI_API_KEY` (primary AI)
- `EXPO_PUBLIC_GROQ_API_KEY` (backup AI)
- `EXPO_PUBLIC_BACKEND_URL` (local: http://localhost:3000)

## AI Provider Management
Backend supports multiple AI providers with runtime switching:
- **Gemini**: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash, gemini-2.5-flash
- **Z.AI**: glm-4-flash, glm-4.7-flash, glm-4.5-flash (default)
- **OpenRouter**: google/gemini-2.0-flash-lite, meta-llama/llama-3-70b-instruct, mistralai/mistral-7b-instruct, nvidia/nemotron-3-super-120b-a12b:free

API endpoints:
- `GET /api/settings/provider` - Current provider
- `POST /api/settings/provider` - Switch provider
- `GET /api/settings/models` - Available models
- `POST /api/settings/model` - Switch model

Frontend now includes a dual-selection UI:
1. Provider selection (Gemini, Z.AI, OpenRouter)
2. Model selection dropdown that updates dynamically based on selected provider

## Firebase Configuration
- **Firestore**: Job applications, user profiles, pipeline status
- **Auth**: User authentication
- **Storage**: Resume uploads, generated documents
- **Hosting**: Web deployment at `dist/` folder

## Key Features & Endpoints
- **Job Evaluation**: `POST /api/evaluate` - URL-based job analysis
- **CV Tailoring**: `POST /api/tailor` - Resume optimization
- **Assistant**: `POST /api/assistant` - AI chat with audio support
- **Interview Prep**: `POST /api/match-stories` - Story matching
- **Discovery Agent**: `POST /api/agent/discover` - Job search automation
- **CV Extraction**: `POST /api/extract-cv` - Document parsing

## Development Constraints
- **Zero-Cost Principle**: All infrastructure must stay within free-tier limits
- **Security**: API keys only in backend, never client-side
- **UI Standard**: Premium "AuraJobs" aesthetic (Mesh gradients, Bento cards)
- **New Architecture**: Expo Router with `newArchEnabled: true`

## TODO / Migration Notes
- **SDK 54 Migration**: Replace `expo-av` with `expo-audio` and `expo-video` when upgrading to SDK 54

## File Structure
- `app/` - Expo Router navigation and screens
- `backend/` - Express API server
- `components/` - Reusable React Native components
- `constants/` - App constants and configurations
- `services/` - Firebase services and API clients
- `store/` - Zustand state management
- `types/` - TypeScript type definitions

## Testing & Verification
- No formal test suite configured
- Manual testing required for AI features
- Verify API responses with different providers
- Test Firebase integration locally