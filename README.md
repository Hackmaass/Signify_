# 🖐️ Signify

> **Your Personal AI-Powered ASL Tutor.**
> *Master American Sign Language with real-time feedback, powered by Gemini and MediaPipe.*

![App Screenshot](public/logo.png)

## 🚀 Overview

**Signify** is a next-generation education platform designed to gamify the experience of learning American Sign Language (ASL). Unlike traditional video courses, Signify uses your webcam to **watch you sign** and provides instant, AI-driven corrections.

Whether you're learning the alphabet or complex phrases, our "Live Tutor" ensures you get the hand shapes right every time.

## ✨ Key Features

- **📷 Real-Time Hand Tracking**: Uses **MediaPipe** (running entirely in your browser) to detect 21 hand landmarks with high precision.
- **🤖 Artificial Intelligence Feedback**: Powered by **Google Gemini 1.5 Flash**, the app analyzes your hand positioning and explains *exactly* how to fix your form (e.g., "Tuck your thumb in more").
- **🔥 Gamification**: Maintain your **Daily Streak**, track completed lessons, and earn momentum as you learn.
- **📚 Dynamic Curriculum**:
  - **Static Lessons**: Learn the A-Z Alphabet.
  - **Dynamic Phrases**: Learn words like "Hello", "Thank You", and "I Love You" with motion tracking.
  - **AI Generator**: Type *any* phrase, and Gemini will generate a custom lesson plan for it instantly.
- **🎨 Modern UI**: Built with a sleek, "Glassmorphism" aesthetic, dark mode support, and smooth Framer Motion animations.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Vanilla CSS (for glass effects)
- **Computer Vision**: Google MediaPipe (Hands)
- **AI Logic**: Google Gemini API (Multimodal Vision)
- **Backend/Auth**: Firebase (Auth, Firestore)
- **Deployment**: Vercel

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- A Webcam
- API Keys for **Google Gemini** and **Firebase**.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Hackmaass/Signify_.git
    cd Signify_
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file (or set in Vercel):
    ```env
    VITE_GEMINI_API_KEY=your_gemini_key_here
    ```

4.  **Configure Firebase**
    Update `services/firebaseService.ts` with your Firebase Configuration object (API Key, Project ID, etc.).

5.  **Run Locally**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` to start learning!

## 🚢 Deployment

This project is optimized for **Vercel**.

1.  Push your code to GitHub.
2.  Import the repo into Vercel.
3.  Add your `GEMINI_API_KEY` to Vercel Environment Variables.
4.  **Important**: Add your Vercel domain to the **Authorized Domains** list in your Firebase Console authentication settings.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements.

---

*Built with ❤️ for Cyberathon.*
