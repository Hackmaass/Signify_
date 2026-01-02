# Deploying Signify to Vercel

Since your project is a Vite-based React application, deploying to Vercel is straightforward.

## Prerequisites

- A GitHub account.
- A Vercel account (log in with GitHub).
- The project pushed to your GitHub repository: `https://github.com/Hackmaass/Signify_.git`.

## Steps

1.  **Log in to Vercel** and go to your **Dashboard**.
2.  Click **"Add New..."** -> **"Project"**.
3.  **Import Git Repository**:
    *   Find `Signify_` in the list (you might need to adjust permissions if it's not visible).
    *   Click **Import**.
4.  **Configure Project**:
    *   **Framework Preset**: It should auto-detect **Vite**. If not, select it.
    *   **Root Directory**: Leave as `./` (default).
    *   **Build Command**: `vite build` (default).
    *   **Output Directory**: `dist` (default).
    *   **Install Command**: `npm install` (default).
5.  **Environment Variables** (Crucial!):
    *   Expand the **Environment Variables** section.
    *   Add the following variable:
        *   **Key**: `GEMINI_API_KEY` (or `VITE_GEMINI_API_KEY` if you changed the code to check that too, but our code checks `process.env.API_KEY` which Vite maps from `GEMINI_API_KEY` in `vite.config.ts`)
        *   **Value**: `AIzaSyA1VgyddwDbwScM8Sxp13dRaK7G66L3eKw`
    *   *Note: In `vite.config.ts`, we mapped `process.env.API_KEY` to `env.GEMINI_API_KEY`, so setting `GEMINI_API_KEY` in Vercel is the correct action.*
6.  Click **Deploy**.

## Post-Deployment

- Vercel will build your project. If successful, you'll get a production URL (e.g., `https://signify-app.vercel.app`).
- **Test the App**: Open the URL, grant camera/microphone permissions, and try the Live Tutor.
- **Firebase Auth Domains**:
    *   Go to your **Firebase Console** -> **Authentication** -> **Settings** -> **Authorized Domains**.
    *   Add your new Vercel domain (e.g., `signify-app.vercel.app`) to the list. This allows Google Sign-In to work.

## Troubleshooting

- **Gemini Connection Failed**: Check the browser console. If you see 401/403 errors, verify the API Key in Vercel settings.
- **Page Not Found on Refresh**: We added `vercel.json` to handle this, but if it happens, ensure the file is in the root of your repo.
