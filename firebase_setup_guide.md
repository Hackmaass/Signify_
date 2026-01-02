---
description: Setup Firebase Authentication and Firestore for the Signify app
---

# Firebase Setup Guide

Follow these steps to fully configure the backend for Signify.

## Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"**.
3. Name it `Signify` (or similar).
4. Disable Google Analytics (optional, makes setup faster).
5. Click **"Create Project"**.

## Step 2: Register the App
1. On the Project Overview page, click the **Web icon** (`</>`).
2. App nickname: `Signify-Web`.
3. **Uncheck** "Also set up Firebase Hosting" (we are using Vercel).
4. Click **"Register app"**.
5. **COPY the `firebaseConfig` object** shown on screen. It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

## Step 3: Enable Authentication
1. Go to **Build** > **Authentication** in the left sidebar.
2. Click **"Get Started"**.
3. Select **"Email/Password"** from the Sign-in method list.
4. Toggle **"Enable"**.
5. Click **"Save"**.

## Step 4: Setup Database (Firestore)
1. Go to **Build** > **Firestore Database**.
2. Click **"Create Database"**.
3. Choose a location (e.g., `nam5 (us-central)`).
4. **IMPORTANT**: Start in **Test Mode**.
   *   *Security Warning*: Test mode allows anyone to read/write for 30 days. For a hackathon/demo, this is fine. For production, you will need security rules.
5. Click **"Create"**.

## Step 5: Update Code
1. Open `services/firebaseService.ts` in your editor.
2. Replace the `firebaseConfig` object (blocks lines 15-22) with the ONE you copied in Step 2.
3. You can either hardcode them (easier for hackathon) or use environment variables.

## Step 6: Final Verification
1. Run `npm run dev` locally.
2. Create a new account on the Login screen.
3. Check your Firebase Console > **Authentication** > **Users** tab. You should see the new user there.
