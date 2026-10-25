# AI-Driven 8-Bit Web Game

An educational web game for exploring college programs and career paths through a retro, pixel-art campus. Players create a profile, explore campus scenes, complete course-related, skill, and personality assessments, and review progress and AI-generated guidance on their Dashboard.

> **Project status:** This project is maintained for educational and portfolio purposes under PLMUN and remains under active development. The current account system is a prototype; read [Security and privacy](#security-and-privacy) before using real personal information.

## Contents

- [Key features](#key-features)
- [Game flow](#game-flow)
- [Design and accessibility](#design-and-accessibility)
- [Security and privacy](#security-and-privacy)
- [Technology](#technology)
- [Project structure](#project-structure)
- [Run locally](#run-locally)
- [Build and deployment](#build-and-deployment)

## Key features

- **Campus exploration:** Explore the Outdoor area, Left Wing, Hallway, Classroom, and Right Wing. Interact with NPCs, visit course areas, and open game features from their campus locations.
- **Profile and preferences:** Create a character, choose skills and personality traits, and select courses to explore. Account Management supports registration and updating profile information.
- **Three assessment types per course:**
  - **Course-Related:** Five multiple-choice questions about course topics, with explanations, references, and scores.
  - **Skill:** Five first-person statements answered on a five-point agreement scale.
  - **Personality:** Five first-person statements answered on a five-point agreement scale.
- **Results and history:** Review answers, correct answers where applicable, explanations, sources, links, and assessment scores. The Dashboard shows completion status, course progress, and assessment history.
- **AI career guidance:** After all three assessments are completed for a course, request a Gemini-generated analysis based on completed course assessments, answers, scores, and saved preferences. Review recommendations, regenerate suggestions, and download the report as a PDF.
- **Dashboard:** Review profile details, selected and other courses, assessment progress, skills, personality preferences, and AI comments. Search by Player ID to view another player's available dashboard information.
- **Leaderboard:** Browse player assessment rankings and filter by course.
- **Player manual:** Open the in-game guide for campus directions, features, assessments, and recommendations.
- **Desktop and mobile controls:** Use keyboard controls or mobile touch controls. Settings include sound, mobile mode, name visibility, and key-guide visibility.
- **Guest play and accounts:** Explore as a guest or log in to continue using a player profile.

## Game flow

1. Open the login page and choose guest play or account login.
2. Complete Character Creation and Preferences Discovery in the Left Wing. Choose your character details, preferences, and courses.
3. Explore the Hallway and choose a course. You can also explore courses you did not select in your profile.
4. Complete the Course-Related, Skill, and Personality assessments for each course you want evaluated. Reach the result screen to save an assessment.
5. Open the Dashboard to review scores, results, and progress. A course is ready for evaluation when all three assessments are complete.
6. Generate and review AI comments and recommendations. Completing additional courses enables a broader comparison.

AI-generated guidance is informational and intended to support exploration; it is not a definitive academic or career decision.

## Design and accessibility

- Built around an 8-bit campus setting, pixel-art assets, retro typography, and game-style dialogue and assessment feedback.
- Phaser scales and centers the game canvas to fit the available screen. The interface includes desktop keyboard controls and touch controls for mobile play.
- Settings let players choose mobile mode and hide the player name or keyboard guide.
- The manual supports navigation by menu, left/right arrow keys, and dragging a page horizontally. Its illustrations cannot be natively dragged.
- Assessment feedback uses answer animations and color cues, followed by explanations and sources when available.

## Security and privacy

The application includes some user-facing safeguards: password and PIN format checks during account setup, masked password/PIN fields, an account-recovery flow, and a backend CORS origin allowlist. **These are not a substitute for server-side authentication or database access controls.**

**Important limitation:** In the current implementation, account login and password recovery read player records from Firebase Realtime Database in the browser and compare the password and PIN client-side. Credentials are stored in the player record without password hashing, and the app does not use Firebase Authentication for these flows. Do not use a reused password, sensitive personal information, or this prototype to protect accounts or data that require production-grade security.

Before deploying for real users or sensitive data:

- Implement a proper authentication provider and verify credentials server-side; store passwords using an appropriate password-hashing scheme.
- Configure and test restrictive Firebase Realtime Database security rules. The Firebase web configuration is client-visible and must not be treated as a secret; database rules must enforce access control.
- Keep `GEMINI_API_KEY` on the backend in an environment variable. Never put the Gemini API key in frontend code or commit it to the repository.
- Treat CORS as a browser cross-origin policy, not as authentication or authorization.
- Review privacy, retention, and consent requirements for any player data sent to Firebase or to the Gemini API.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, HTML, CSS |
| Game | Phaser 3 |
| Backend | Node.js, Express |
| Data | Firebase Realtime Database |
| AI | Google Gemini API via the backend |
| Reports | jsPDF |
| Deployment targets | GitHub Pages (frontend), Render (backend) |

## Project structure

```text
.
├── backend/
│   ├── routes/              # Quiz generation and AI comment endpoints
│   ├── services/            # Gemini integration
│   ├── utils/               # Explanation normalization and JSON parsing
│   └── server.js            # Express server and CORS configuration
├── frontend/
│   ├── public/assets/       # Game, character, audio, and manual assets
│   ├── src/
│   │   ├── components/      # Dashboard, account flows, manual, results
│   │   ├── config/          # Firebase client configuration
│   │   ├── pages/
│   │   │   ├── data/        # Assessment and manual content
│   │   │   ├── prefabs/     # Reusable Phaser game objects
│   │   │   └── scenes/      # Outdoor, Left Wing, Hallway, Classroom, Right Wing
│   │   ├── services/        # Player data helpers
│   │   └── types/           # Shared TypeScript types
│   ├── styles/              # Application, game, and component styles
│   ├── Game.html            # Game entry point
│   ├── index.html           # Login entry point
│   └── vite.config.ts
└── README.md
```

## Run locally

### Prerequisites

- Node.js and npm
- A Firebase project configured for Realtime Database and compatible with the frontend configuration
- A Gemini API key for AI assessment generation and comments

### Install dependencies

Run these commands from the repository root:

```sh
npm install
npm install --prefix frontend
npm install --prefix backend
```

### Configure the backend

Set `GEMINI_API_KEY` in the backend process environment. For PowerShell:

```powershell
$env:GEMINI_API_KEY = "your-gemini-api-key"
```

Do not commit API keys or other secrets. The backend listens on port `10000` by default. From the repository root, start the frontend and backend together:

```sh
npm run start
```

The frontend development server uses port `3000`. You can also run each service separately from its directory:

```sh
# Terminal 1
cd backend
npm start

# Terminal 2
cd frontend
npm run dev
```

The frontend selects `http://localhost:10000` for its local API and the deployed Render service for non-local hosts.

## Build and deployment

Build the frontend from its directory:

```sh
cd frontend
npm run build
```

This runs the TypeScript check and creates the production site in `frontend/dist`. The frontend is configured with the `/8-Bit/` base path for GitHub Pages. The backend starts with `npm start` in `backend` and requires `GEMINI_API_KEY` to generate AI content.

The project is configured for GitHub Pages frontend deployment and Render backend hosting. The current public game is available at [krobbus.github.io/8-Bit](https://krobbus.github.io/8-Bit/).
