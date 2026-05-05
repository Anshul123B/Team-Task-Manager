Team Task Manager

Team Task Manager is a lightweight full-stack productivity app (MERN) with JWT authentication, project collaboration, and a Kanban task board.

Local setup (quick)

Prerequisites:
- Node.js 18+
- (Optional) MongoDB if you want to use the real backend

Install and run (from repo root):

1. Install dependencies

```bash
npm install
```

2. Start both server and client in development (parallel)

```bash
npm run dev
```

Or run separately:

```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

Environment:
- Copy `server/.env.example` → `server/.env` and set `MONGO_URI` and `JWT_SECRET` when using the backend.
- `.env` files are ignored by `.gitignore` and must NOT be committed.

Open the client at the Vite address shown in the console (usually http://localhost:5173 or the next available port).

For API details and full documentation, see the code in `server/` and `client/src/`.
