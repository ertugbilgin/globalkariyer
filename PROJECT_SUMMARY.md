# GoGlobalCV.com - Project Summary

## Project Overview
**GoGlobalCV.com** is an AI-powered career assistant designed to help users optimize their CVs for global standards. It provides ATS compatibility analysis, job match scoring, interview preparation, and cover letter generation.

## Key Features
- **CV Analysis:** Detailed ATS compatibility check, scoring (0-100), and improvement suggestions.
- **Job Match Score:** Analyzes how well a CV matches a specific Job Description (JD).
- **Interview Prep Kit:** Generates personalized interview questions and answers based on CV and JD.
- **Cover Letter Generator:** Creates tailored cover letters.
- **Multi-language Support:** Supports English, Turkish, and Chinese.
- **Mobile Responsive:** Optimized for mobile devices with a "zoomed out" feel.

## Recent Updates (v52.1)
- **Job Match Modal:** Added a dedicated modal to input JD if missing initially.
- **Smart Job Match:** Automatically updates Job Match Score in the background when JD is added via Cover Letter or Interview Prep modals.
- **Lightweight Analysis:** Implemented `/job-match` endpoint for faster, token-efficient job fit calculation without full re-analysis.
- **Interview Prep Fix:** Fixed an issue where stale interview questions persisted after changing the Job Description. Now automatically resets and regenerates.
- **Mobile UI Improvements:** Applied `scale-90` to modals for better mobile visibility.
- **Analytics:** Enhanced Google Analytics tracking for new features.

## Architecture
- **Frontend:** React (Vite), Tailwind CSS, Lucide React.
- **Backend:** Node.js (Express), Google Gemini AI.
- **Deployment:** Vercel (Frontend), Render (Backend).

## Source Code Structure
- `client/`: Frontend application.
- `server/`: Backend API and AI services.
- `server/controllers/`: Logic for Analysis, Job Match, Cover Letter, etc.
- `server/services/`: AI integration (Gemini) and file parsing.

## Installation & Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    cd client && npm install
    cd ../server && npm install
    ```

2.  **Environment Variables (.env):**
    *   `server/.env`: `GEMINI_API_KEY=...`, `PORT=5001`
    *   `client/.env`: `VITE_API_URL=http://localhost:5001`

3.  **Run Application:**
    *   Terminal 1 (Server): `cd server && npm start`
    *   Terminal 2 (Client): `cd client && npm run dev`

## Current Status
- **Stable:** Core features are fully functional.
- **Optimized:** Token usage reduced for secondary analyses.
- **Responsive:** Mobile view issues resolved.
