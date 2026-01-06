# 🖐️ Signify

> **Your Personal AI-Powered ASL Tutor.** > _Master American Sign Language with real-time feedback, powered by Google Gemini and MediaPipe._

![App Screenshot](public/logo.png)

## 🚀 Overview

**Signify** is a next-generation education platform designed to make learning American Sign Language (ASL) accessible, interactive, and gamified. Unlike traditional video courses, Signify uses your webcam to **watch you sign** and provides instant, AI-driven corrections - just like a private tutor.

Whether you're learning the alphabet or complex phrases, our "Live Tutor" ensures you get the hand shapes right every time.

## ✨ Key Features

- **📷 Real-Time Hand Tracking**: Uses **Google MediaPipe** (running entirely client-side) to detect 21 distinct hand landmarks with high precision and low latency.
- **🤖 AI-Powered Live Tutor**:
  - **Vision Analysis**: Powered by **Google Gemini 3 Flash Preview**, the app analyzes your hand positioning and explains _exactly_ how to fix your form (e.g., "Straighten your thumb").
  - **Conversational Feedback**: Uses **Gemini 2.5 Flash Preview (TTS)** to speak corrections and encouragement to you in a natural voice.
- **🔥 Gamification**: Maintain your **Daily Streak**, track quotas to manage API usage, and view your detailed lesson history.
- **📚 Dynamic Curriculum**:
  - **Static Lessons**: Learn the A-Z Alphabet.
  - **Dynamic Phrases**: Learn words like "Hello", "Thank You" with motion tracking.
  - **AI Generator**: Type _any_ phrase, and Gemini will generate a custom lesson plan for it instantly.
- **🎨 Modern Aesthetic**: Built with a premium "Glassmorphism" UI using **Tailwind CSS**, featuring dark mode and smooth **Framer Motion** animations.

## 🛠️ Google Technologies Implemented

Signify is built on a robust foundation of Google's cutting-edge tools:

1. 🧠 **Google Gemini AI Models**:

   - **Gemini 3 Flash Preview**: Core intelligence for multimodal vision analysis and lesson generation.
   - **Gemini 2.5 Flash Preview**: Powers the Text-to-Speech (TTS) engine for the Live Tutor interface.

2. 🖐️ **Google MediaPipe**:

   - **Hands Solution**: Provides privacy-preserving, real-time skeletal tracking directly in the browser.

3. 🔥 **Firebase**:

   - **Authentication**: Secure email/password login.
   - **Cloud Firestore**: Real-time database for user profiles, streaks, and stats.

4. 🎨 **Google Fonts**:
   - **Inter**: Ensures beautiful, accessible typography.

## 💻 Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS, Lucide React
- **Animations**: Framer Motion, GSAP
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

4.  **Run Locally**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` to start learning!

## 🚢 Deployment

This project is optimized for **Vercel**.

1.  Push your code to GitHub.
2.  Import the repo into Vercel.
3.  Add your `VITE_GEMINI_API_KEY` to Vercel Environment Variables.
4.  **Important**: Add your Vercel domain to the **Authorized Domains** list in your Firebase Console authentication settings.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements.

---

_Built with ❤️ for Cyberathon._
