# 🚀 CareVisit Planner: GitHub & Vercel Deployment Guide

This guide walks you through publishing **CareVisit Planner** to GitHub and deploying it live on Vercel with free hosting.

---

## Step 1: Create Repository on GitHub (Takes 30 Seconds)

1. Open your browser and go to: [https://github.com/new](https://github.com/new)
2. Enter the Repository name:
   ```
   carevisit-planner
   ```
3. Choose **Public** (or **Private**).
4. **Important**: Leave "Add a README file", ".gitignore", and "Choose a license" **unchecked** (we already have all these files prepared in your local project).
5. Click **"Create repository"**.

---

## Step 2: Push to GitHub (1-Click)

Once you have created the empty repository on GitHub, choose either option:

### Option A: Run the Included Batch Script
Double-click:
```
C:\Users\Dell\.antigravity\carevisit-planner\push-to-github.bat
```

### Option B: Run in Terminal
```powershell
cd C:\Users\Dell\.antigravity\carevisit-planner
git push -u origin main
```

Your code will immediately upload to:
👉 **`https://github.com/rishuvloggs-ship-it/carevisit-planner`**

---

## Step 3: Deploy to Vercel (Free 1-Click Git Integration)

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard) and sign in with your GitHub account.
2. Click **"Add New..."** (top right) $\rightarrow$ **"Project"**.
3. Under **"Import Git Repository"**, find **`carevisit-planner`** and click **"Import"**.
4. Configure the Project:
   - **Project Name**: `carevisit-planner`
   - **Framework Preset**: `Vite` (Vercel will auto-detect `vercel.json`)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (auto-detected from `vercel.json`)
   - **Output Directory**: `client/dist` (auto-detected from `vercel.json`)
5. Expand **"Environment Variables"** and add:

| Key | Recommended Value | Notes |
|---|---|---|
| `GEMINI_API_KEY` | `AIzaSyDGNrkY8FEOnM58pEZyuvNr5hZB2lGg4vs` | Your active Google Gemini API Key |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Current high-speed Flash model |
| `JWT_SECRET` | `carevisit-super-secret-jwt-token-2026-key` | Secret string for auth token signing |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/carevisit` | Free MongoDB Atlas URI (see note below) |

> 💡 **Persistent Production Database Note**:
> For local development, CareVisit Planner includes an automatic in-memory MongoDB fallback. For production serverless deployments on Vercel, create a free 512MB database on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) (takes 2 minutes) and paste your connection string as `MONGODB_URI`.

6. Click **"Deploy"**!
7. Vercel will build the frontend and API functions and give you a live production link (e.g. `https://carevisit-planner.vercel.app`).

---

## Architecture of the Vercel Deployment

```
[User Browser]
      │
      ▼
[Vercel Global Edge Network]
      ├───────────────┬──────────────────────────────┐
      │               │                              │
  Static HTML/JS   API Requests (/api/*)         Assets (/assets/*)
  (React / Vite)   (api/index.js Serverless)    (Tailwind CSS, Icons)
                      │
                      ├─────────► MongoDB Atlas (Data persistence)
                      └─────────► Google Gemini API (Natural language parsing & slot suggestions)
```
