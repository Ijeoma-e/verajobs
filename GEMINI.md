# Project Context: AuraJobs (verajobs)

This file tracks the architecture, tech stack, and development history of the AuraJobs project.

## Project Overview
AuraJobs is an AI-powered, agentic job search command center designed to act as a "career co-pilot." It automates the discovery, evaluation, and application tracking of high-fit roles.

## Tech Stack
- **Frontend:** React Native (Expo) + Expo Router
- **Backend:** Node.js (Express) hosted on Vercel
- **Database/Auth:** Firebase Spark Plan (Firestore, Auth, Storage)
- **AI Engine:** Google Gemini 1.5 Flash (Multimodal: Text & Audio)
- **UI Framework:** React Native Paper + Vanilla CSS/Linear Gradients
- **Deployment:** Firebase Hosting (Web) + Vercel (API)

## Key Features
- **Vera Assistant:** Agentic chat interface with real-time audio command processing via Gemini.
- **Job Discovery:** Natural language job searching with "Smart Search" link generation.
- **Interview Prep:** AI-driven matching of your "STAR+R" story bank to specific job descriptions.
- **Pipeline CRM:** Manage job statuses (Evaluating, Applied, Interviewing, Offered, Rejected) with progress filtering.
- **ATS Tailoring:** Automated generation of professional PDF resumes tailored to job descriptions.

## Interaction Mandates
- **Zero-Cost Principle:** All infrastructure and AI tiers must strictly adhere to free-tier limits.
- **UI/UX Standard:** Maintain the premium "AuraJobs" aesthetic (Mesh gradients, Bento-style cards, high-contrast typography, Material Design).
- **Security:** All API keys and environment variables must reside in the backend. The mobile/web client must only interact with the backend API.
- **Verification:** Behavioral correctness of AI agent responses is the primary success metric.
