# SOLARIS 2.0 — BACKEND (API & ML ENGINE)

Express.js + TypeScript + Mongoose + MongoDB Atlas + Python Isolation Forest

## Local Setup & Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   Create `.env` with:
   ```env
   PORT=8787
   MONGODB_URI=your_mongodb_atlas_connection_string
   MONGODB_DB_NAME=solaris_dev
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Start server:
   ```bash
   npm run dev
   ```
   Runs on `http://localhost:8787`.

4. Run tests:
   ```bash
   npm run test:db
   npm run test:economics
   npm run test:doctor
   ```
