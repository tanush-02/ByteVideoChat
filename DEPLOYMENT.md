# Deployment Guide: Render (Backend) & Vercel (Frontend)

This project has a `backend` (Node/Express) and a `frontend` (React). We deploy the backend to Render and the frontend to Vercel.

## Prerequisites
- Render and Vercel accounts
- MongoDB connection string (Atlas or other)
- GitHub repo connected to both platforms (recommended)

---

## Backend on Render

We provide a blueprint at `render.yaml` (repo root) for one web service:

```yaml
services:
  - type: web
    name: bytevideochat-backend
    env: node
    rootDir: backend
    buildCommand: npm install
    startCommand: npm start
    autoDeploy: true
    plan: free
    envVars:
      - key: PORT
        value: 8000
      - key: MONGO_URL
        sync: false
```

### Steps (Dashboard)
1. Push your code to GitHub.
2. In Render, create a new Web Service → “Build from a Blueprint” → select your repo.
3. Set environment variables:
   - `MONGO_URL` = your MongoDB URI.
   - You can omit `PORT`; Render sets `PORT` automatically. The app already uses `process.env.PORT`.
4. Click “Create Resources” and wait for build/deploy.
5. Copy the service URL (e.g., `https://bytevideochat-backend.onrender.com`).

### Notes
- The backend enables CORS for all origins by default.
- Health check: visiting the root shows “Cannot GET /”. Use `/api/v1/users` or `/api/v1/comments` routes.

---

## Frontend on Vercel

We include `frontend/vercel.json` to ensure SPA routing works and CRA builds to `build/`:

```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "build" } }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

The frontend reads an environment variable `REACT_APP_SERVER_URL` to talk to the backend (configured in `frontend/src/environment.js`).

### Steps (Dashboard)
1. In Vercel, “New Project” → import your repo.
2. Set Project Root to `frontend`.
3. Set Environment Variables:
   - `REACT_APP_SERVER_URL` = your Render backend URL (e.g., `https://bytevideochat-backend.onrender.com`).
4. Build & deploy.
5. Open the Vercel URL (e.g., `https://bytevideochat-frontend.vercel.app`).

### Notes
- For local dev, the frontend falls back to `http://localhost:8000`.
- SPA routes (e.g., `/finance`, `/home`) will render via `index.html` due to `vercel.json`.

---

## Verifying Integration
1. Confirm backend is reachable: `curl https://<render-app>.onrender.com/api/v1/users/ping` (if a ping route exists) or test a known API route.
2. Visit Vercel frontend and perform login/comment actions; they should call the backend using `REACT_APP_SERVER_URL`.

## Troubleshooting
- CORS issues: backend has `cors()` enabled; if you restrict origins, set `origin: process.env.CLIENT_ORIGIN` and add this var on Render.
- Mixed content (HTTP vs HTTPS): ensure `REACT_APP_SERVER_URL` uses `https` for Vercel → Render calls.
- Environment variable not picked up: on Vercel, env vars are injected at build time; rebuild after changing them.

## Optional: CLI Deploys

### Vercel CLI
```bash
npm i -g vercel
cd frontend
vercel --prod
# Set REACT_APP_SERVER_URL when prompted or via Vercel dashboard
```

### Render (from Blueprint)
- Dashboard flow recommended. Alternatively, use Render API to provision from `render.yaml`.

---

## Summary
- Backend: Render Web Service using `backend` dir, env `MONGO_URL`.
- Frontend: Vercel project using `frontend` dir, env `REACT_APP_SERVER_URL` pointing to Render backend.