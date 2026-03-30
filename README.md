# Orderly Table

Orderly Table is a restaurant POS and operations app with a React frontend and Spring Boot backend.

## Tech Stack

- Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui
- Backend: Spring Boot 3 (Java 17) + JPA
- Database: PostgreSQL (configured for Supabase)

## Repository Layout

- `frontend/`: Vite React application
- `backend/`: Spring Boot API service
- `data for migration/`: SQL and JSON files for menu/table/user migration tasks

## Prerequisites

- Node.js 18+
- npm 9+
- Java 17
- Maven 3.9+
- PostgreSQL-compatible database (Supabase recommended)

## Local Development

### 1. Configure backend environment

Create `backend/.env` with the following values:

```env
PORT=8081
SUPABASE_DB_HOST=your-db-host
SUPABASE_DB_PORT=6543
SUPABASE_DB_USER=your-db-user
SUPABASE_DB_PASSWORD=your-db-password

# Optional AI settings
GROQ_API_KEY=
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_API_MODEL=llama-3.1-8b-instant
```

Notes:

- If `PORT` is not set, backend defaults to `8081`.
- `SUPABASE_DB_PORT` defaults to `6543` when omitted.

### 2. Run backend

From repository root:

```bat
start-backend.bat
```

Or manually:

```sh
cd backend
mvn spring-boot:run
```

### 3. Run frontend

```sh
cd frontend
npm install
npm run dev
```

Frontend dev server runs on `http://localhost:5000`.

In development, `/api` requests are proxied to `http://localhost:8081` via Vite config.

### 4. Run both services on Windows

From repository root:

```bat
start-app.bat
```

## Frontend Environment

Optional: create `frontend/.env`.

```env
VITE_API_URL=
```

- Leave empty to use relative API paths (for same-origin/proxy setups).
- Set to a full backend URL (for example `https://your-api-domain`) when deploying frontend and backend separately.

## Useful Commands

### Frontend

```sh
cd frontend
npm run dev
npm run build
npm run test
npm run lint
```

### Backend

```sh
cd backend
mvn clean test
mvn spring-boot:run
```

## Deployment

### Backend on Render

1. Create a Web Service from this repository.
2. Set Root Directory to `backend`.
3. Use the included `backend/Dockerfile`.
4. Configure env vars:
   - `PORT`
   - `SUPABASE_DB_HOST`
   - `SUPABASE_DB_PORT` (optional, defaults to `6543`)
   - `SUPABASE_DB_USER`
   - `SUPABASE_DB_PASSWORD`
   - `GROQ_API_KEY` (optional)

### Frontend on Vercel

1. Import repository in Vercel.
2. Set Root Directory to `frontend`.
3. Keep `frontend/vercel.json` rewrite updated to your backend URL if using path proxying.
4. Alternatively set `VITE_API_URL` in Vercel environment variables.

## Features

- Table management and occupancy tracking
- Menu and category management
- Order lifecycle workflow
- Kitchen and billing related pages
- Role-aware/authenticated UI flows

## License

Private and proprietary.
