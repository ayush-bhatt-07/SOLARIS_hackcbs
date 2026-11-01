# SOLARIS 2.0 — FRONTEND (CLIENT)

React 19 + TypeScript + Vite + Tailwind CSS + Three.js

## Local Setup & Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```
   Runs on `http://localhost:3000`. By default, API calls to `/api` proxy to `http://127.0.0.1:8787`.

3. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables
* `VITE_API_BASE_URL`: Base URL of the backend API (defaults to `/api` for local proxy, or set to your deployed backend URL on Render/Railway, e.g. `https://solaris-backend.onrender.com/api`).
