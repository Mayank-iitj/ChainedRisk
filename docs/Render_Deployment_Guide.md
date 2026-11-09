# 🚀 Deploying ChainedRisk to Render

This comprehensive guide details how to deploy **both the Backend API and Frontend UI** of **ChainedRisk** to [Render](https://render.com) using the included `render.yaml` Blueprint or manual setup.

---

## ⚡ Deployment Architectures Supported

Render supports two deployment patterns for ChainedRisk:

### 1. Two-Tier Deployment (Both Services on Render)
* **Backend API (`chainedrisk-api`)**: Python Web Service running FastAPI, the Correlator Engine, and WebSockets with a 1 GB persistent disk for the SQLite database.
* **Frontend Static Site (`chainedrisk-frontend`)**: Fast global CDN static site serving the React 18 SPA with client-side routing, connected directly to `chainedrisk-api` via `VITE_API_URL`.

### 2. Unified All-in-One Deployment (`chainedrisk-unified`)
* A single Docker Web Service where FastAPI serves both the API endpoints (`/api/v1/*`), WebSockets (`/ws`), and the compiled React SPA directly from `/` with client-side SPA routing.

---

## 🚀 1-Click Render Blueprint Setup

1. Push this repository to your GitHub account:
   ```bash
   git push origin main
   ```

2. Open the [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Select the `ChainedRisk` repository.
5. Render will automatically parse `render.yaml` and offer to provision:
   * **`chainedrisk-api`** (Backend Web Service + Persistent Disk)
   * **`chainedrisk-frontend`** (Static Site with SPA routing & auto-linked API origin)
   * **`chainedrisk-unified`** (Optional all-in-one container)
6. Provide your Google OAuth credentials in the environment prompt:
   * `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (from Google Cloud Console)
   * `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
7. Click **Apply**. Render will deploy both services automatically!

---

## 🛠️ Manual Deployment Steps (If Not Using Blueprints)

### Part 1: Deploy the Backend API (`chainedrisk-api`)
1. In Render, click **New +** -> **Web Service**.
2. Select your repository `ChainedRisk`.
3. Configure the backend:
   * **Name**: `chainedrisk-api`
   * **Runtime**: `Python`
   * **Region**: `Oregon` (or closest to your users)
   * **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   * **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Add Persistent Disk (under **Disks** section):
   * **Name**: `chainedrisk-api-data`
   * **Mount Path**: `/opt/render/project/src/data`
   * **Size**: `1 GB`
5. Configure Environment Variables:
   | Key | Value | Description |
   |---|---|---|
   | `CR_ENV` | `production` | Production mode |
   | `CR_SECRET_KEY` | *(Click Generate)* | Session encryption key |
   | `CR_APPROVAL_HMAC_KEY` | *(Click Generate)* | HMAC token verification key |
   | `CR_DB_URL` | `sqlite:////opt/render/project/src/data/chainedrisk.db` | Persistent database path |
   | `GOOGLE_CLIENT_ID` | `<your-google-client-id>` | Google OAuth Client ID |
   | `GOOGLE_CLIENT_SECRET` | `<your-google-client-secret>` | Google OAuth Client Secret |
6. Click **Create Web Service**. Note the assigned URL (e.g. `https://chainedrisk-api.onrender.com`).

---

### Part 2: Deploy the Frontend UI (`chainedrisk-frontend`)
1. In Render, click **New +** -> **Static Site**.
2. Select your repository `ChainedRisk`.
3. Configure the static site:
   * **Name**: `chainedrisk-frontend`
   * **Root Directory**: `frontend`
   * **Build Command**: `npm install && npm run build`
   * **Publish Directory**: `dist`
4. Configure Rewrites/Redirects (under **Redirects/Rewrites** section):
   * **Source**: `/*`
   * **Destination**: `/index.html`
   * **Action**: `Rewrite` (required for React Router/SPA hash navigation)
5. Configure Environment Variables:
   | Key | Value | Description |
   |---|---|---|
   | `VITE_API_URL` | `https://chainedrisk-api.onrender.com` | URL of the backend API service |
6. Click **Create Static Site**.

---

## 🔑 Configure Google Cloud OAuth for your Render Domains

After deploying both services, configure Google OAuth to authorize both origins:

1. Open the [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Click on your OAuth 2.0 Web Client ID.
3. Under **Authorized JavaScript origins**, add:
   ```text
   https://chainedrisk-frontend.onrender.com
   https://chainedrisk-api.onrender.com
   ```
4. Under **Authorized redirect URIs**, add:
   ```text
   https://chainedrisk-frontend.onrender.com
   https://chainedrisk-api.onrender.com
   https://chainedrisk-api.onrender.com/api/v1/auth/google/callback
   ```
5. Click **Save**.

---

## ✅ Deployment Verification Checklist

- [x] Access `https://chainedrisk-frontend.onrender.com`
- [x] Sign in using Google OAuth
- [x] Complete the 4-step interactive onboarding intake (Ingress perimeter & Crown jewels)
- [x] View your personalized Attack Graph and verified vulnerability findings
