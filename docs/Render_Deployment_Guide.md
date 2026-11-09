# 🚀 Deploying ChainedRisk to Render

This comprehensive guide details how to deploy **ChainedRisk** to [Render](https://render.com) as a production-grade, self-hosted multi-stage attack correlation system.

---

## ⚡ Architecture on Render

ChainedRisk is packaged as a **Unified Cloud Service**:
- **Frontend SPA**: React 18 + Vite compiled into `frontend/dist` with pure monochrome styling, dynamic ReactFlow graph visualization, and interactive intake forms.
- **Backend API & Engine**: FastAPI + SQLAlchemy + Uvicorn hosting the API (`/api/v1/*`), WebSockets (`/ws`), and serving the frontend from `/` with client-side SPA routing.
- **Persistent Disk**: 1 GB mounted disk at `/app/data` to ensure all projects, custom telemetry, attack chains, and audit ledgers persist permanently across restarts.

---

## Option A: 1-Click Blueprint Deployment (Recommended)

1. **Fork or Push** this repository to your GitHub account:
   ```bash
   git remote add origin https://github.com/<your-username>/ChainedRisk.git
   git push -u origin main
   ```

2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** in the top right corner and select **Blueprint**.
4. Connect your GitHub repository: `ChainedRisk`.
5. Render will automatically parse `render.yaml` and configure:
   - **Service Name**: `chainedrisk`
   - **Runtime**: Docker (Multi-Stage Production Image)
   - **Persistent Disk**: `chainedrisk-storage` (1 GB) mounted at `/app/data`
   - **Health Check**: `/`
6. Fill in the required environment variables:
   - `GOOGLE_CLIENT_ID`: Your Google Cloud OAuth Client ID (e.g. `your-client-id.apps.googleusercontent.com`)
   - `GOOGLE_CLIENT_SECRET`: Your Google Cloud OAuth Client Secret (e.g. `GOCSPX-your-secret-key`)
7. Click **Apply**. Render will automatically build the frontend, package the Python service, and launch the application!

---

## Option B: Manual Web Service Setup

If you prefer configuring the Web Service manually:

1. Click **New +** -> **Web Service**.
2. Select your repository `ChainedRisk`.
3. Configure the service settings:
   - **Name**: `chainedrisk`
   - **Region**: Oregon (US West) or closest to your users
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Instance Type**: `Free` or `Starter`
4. Add Persistent Disk (under **Disks** section):
   - **Name**: `chainedrisk-storage`
   - **Mount Path**: `/app/data`
   - **Size**: `1 GB`
5. Configure Environment Variables (under **Environment** tab):
   | Key | Value | Description |
   |---|---|---|
   | `CR_ENV` | `production` | Production environment flag |
   | `CR_SECRET_KEY` | *(Click Generate)* | Session signature key |
   | `CR_APPROVAL_HMAC_KEY` | *(Click Generate)* | Cryptographic verification HMAC key |
   | `CR_DB_URL` | `sqlite:////app/data/chainedrisk.db` | Persistent SQLite database path |
   | `GOOGLE_CLIENT_ID` | `your-google-client-id` | Google OAuth Client ID |
   | `GOOGLE_CLIENT_SECRET` | `your-google-client-secret` | Google OAuth Client Secret |
6. Click **Create Web Service**.

---

## 🔑 Configure Google OAuth for your Render URL

Once Render provisions your service, you will receive a public HTTPS URL (e.g. `https://chainedrisk.onrender.com`).

1. Open the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Click on your OAuth 2.0 Client ID.
3. Under **Authorized JavaScript origins**, add:
   ```text
   https://chainedrisk.onrender.com
   ```
4. Under **Authorized redirect URIs**, add:
   ```text
   https://chainedrisk.onrender.com
   https://chainedrisk.onrender.com/api/v1/auth/google/callback
   ```
5. Click **Save**.

---

## 🎯 Verification Checklist

- [x] Navigate to `https://chainedrisk.onrender.com`
- [x] Sign in securely using your Google Workspace / Gmail account
- [x] Complete the 4-step onboarding intake by feeding your actual org, custom ingress assets, and internal crown jewels
- [x] Inspect your personalized Attack Graph and verified telemetry in the dashboard!
