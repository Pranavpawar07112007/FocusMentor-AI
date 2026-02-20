# FocusMentor AI 🧠🚀

**FocusMentor AI** is an intelligent productivity companion designed to help users optimize their study and work sessions. By combining traditional focus techniques with advanced Generative AI, FocusMentor tracks performance, breaks down complex goals, and provides actionable insights to improve habit formation.

Built with **Next.js**, **Firebase**, and **Google Genkit**.

## ✨ Key Features

- **⏱️ Smart Focus Timer**: Distraction-free focus timer with customizable intervals (Pomodoro style).
- **🤖 AI-Powered Insights**:
  - **Goal Decomposition**: Uses Genkit to break down large, vague goals into actionable micro-tasks.
  - **Session Summaries**: AI analyzes your logs to generate summaries of your productivity.
  - **Screen Activity Analysis**: Intelligent analysis of work habits.
- **🏆 Gamification System**: Earn badges, track streaks, and level up your productivity profile to stay motivated.
- **📊 Analytics Dashboard**: Visual charts tracking productivity by hour, historical trends, and success rates.
- **🔐 Secure Authentication**: Robust user management using Firebase Authentication.
- **☁️ Cloud Sync**: Real-time data synchronization with Firestore.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Shadcn UI
- **Backend/Database**: Firebase (Firestore, Auth)
- **AI Engine**: [Google Genkit](https://firebase.google.com/docs/genkit) (Gemini Models)
- **Deployment**: Firebase App Hosting
- **Development Env**: Project IDX (Configured via `.idx/dev.nix`)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- A Firebase Project with Firestore and Auth enabled.
- A Google Cloud Project with Vertex AI API enabled (for Genkit).

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/focusmentor-ai.git](https://github.com/yourusername/focusmentor-ai.git)
   cd focusmentor-ai
2. **Install dependencies:**
  npm install
  # or
  pnpm install
3. **Environment Setup:**
  # Firebase Client Config
  NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

  # Genkit / Google AI Config
  GOOGLE_GENAI_API_KEY=your_gemini_api_key
4. **Run the development server:**
    npm run dev

##📂 Project Structure
src/
├── ai/                 # Genkit AI flows (Goal decomposition, Summaries)
├── app/                # Next.js App Router pages (Dashboard, Login, History)
├── components/         # React components
│   ├── app/            # App-specific widgets (Focus Ring, Charts)
│   └── ui/             # Reusable UI components (Shadcn)
├── firebase/           # Firebase configuration and hooks
├── lib/                # Utilities and Achievements logic
└── types/              # TypeScript definitions
