<div align="center">

# Tiezi

**A mobile-first AI gym onboarding app for people who do not know where to start.**

![Web App](https://img.shields.io/badge/Web_App-React_PWA-2563eb)
![Backend](https://img.shields.io/badge/Backend-FastAPI-059669)
![Database](https://img.shields.io/badge/Database-SQLite_Postgres--ready-7c3aed)
![AI](https://img.shields.io/badge/AI-OpenAI_Adapter-c2410c)
![Workflow](https://img.shields.io/badge/Workflow-Scan_To_Log-111827)

`npm run dev` + `cd backend && uv run uvicorn app.main:app --reload --port 8000`

</div>

> Point your phone at a gym machine, let Tiezi explain it, add it to today's workout, and log the first set without turning fitness into homework.

Tiezi is built for the most awkward moment in the gym: standing in front of a machine, not knowing what it is, how to adjust it, what it trains, or whether you should use it today.

This repository turns that moment into a working product loop: a React mobile PWA, a FastAPI backend, SQL persistence, seeded beginner workout data, and AI adapters for equipment recognition and natural-language workout logging.

## The 30-Second Version

| You have | Tiezi gives you |
|---|---|
| A beginner in a gym | A clear, guided first workout loop |
| A photo of equipment | Beginner-safe equipment recognition and exercise suggestions |
| A default workout plan | Persisted plan data with stable local IDs |
| A messy workout note | Structured set records that still require user confirmation |
| No backend during demo | Frontend mock mode that runs the whole MVP |
| A real backend available | FastAPI real API mode with SQL persistence |

## Product Promise

Tiezi is not a full fitness super-app. It is intentionally tighter:

```text
Open app
  |
  v
Skip heavy onboarding
  |
  v
Scan gym equipment
  |
  v
Understand what it is
  |
  v
Read beginner instructions
  |
  v
Add to today's workout
  |
  v
Train and log sets
```

The first phase is designed to make the gym feel usable for beginners before it tries to become a complete coaching platform.

## Capability Matrix

| Capability | What it does | Why it matters |
|---|---|---|
| Mobile PWA flow | Ships welcome, home, scan, result, exercise, workout, log, and profile screens | The core product can be tried from a browser immediately |
| Mock-first frontend | Runs the whole MVP without a backend | Fast demo path and safer UI iteration |
| Real API switch | Uses `VITE_USE_REAL_API` to choose mock or backend services | Keeps page code clean and backend-ready |
| FastAPI contract | Implements the current frontend endpoint map | Lets the React app switch to real data without a page rewrite |
| SQL persistence | Stores profile, equipment, exercises, workout plans, sessions, and set records | Makes workout changes survive backend reads |
| Seeded beginner data | Provides stable IDs such as `user_local_001` and `plan_beginner_day_1` | Keeps frontend, tests, and demos predictable |
| AI equipment scan | Normalizes real provider output into `ScanResult` | Gives beginners a controlled recognition experience |
| AI workout parsing | Converts workout notes into editable set records | Keeps logging light while requiring user confirmation |
| Safety language | Detects pain, discomfort, old injury, and strain language | Avoids medical diagnosis and nudges users to stop and seek professional help |
| Test stubs | Tests AI flows without real credentials | Keeps CI and local verification deterministic |

## Demo Preview

The app is optimized for a compact mobile product surface:

```text
/welcome
  "I do not know this machine" -> scan

/scan
  camera or image upload -> recognition state

/scan/result
  machine name, beginner name, trained areas, confidence, next action

/exercise/:exerciseId
  setup tips, steps, common mistakes, safety notes

/workout/session
  checklist, current exercise, progress, record action

/workout/log
  natural-language parse or manual set editor -> user confirmation -> save
```

## Architecture

```text
React pages
  |
  v
src/services/tieziApi.ts
  |
  |-- VITE_USE_REAL_API=false --> src/services/mockApi.ts
  |
  `-- VITE_USE_REAL_API=true  --> src/services/realApi.ts
                                      |
                                      v
                                FastAPI backend
                                      |
                                      |-- SQLAlchemy + Alembic
                                      |-- SQLite local default
                                      |-- Postgres-ready DATABASE_URL
                                      `-- OpenAI adapter
```

The frontend does not call backend URLs from page components. All business calls go through the service facade, so the app can move between mock and real API mode without rewriting the UI.

## Tech Stack

### Frontend

| Layer | Stack |
|---|---|
| Framework | React 18 |
| Build | Vite |
| Language | TypeScript |
| Routing | React Router |
| State | Zustand |
| Data boundary | TanStack Query plus service facade |
| Forms | React Hook Form |
| Validation | Zod |
| Icons | lucide-react |
| PWA | vite-plugin-pwa |
| Styling | Tailwind CSS plus local UI components |

### Backend

| Layer | Stack |
|---|---|
| Framework | FastAPI |
| Language | Python 3.11+ |
| Environment | uv |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Database | SQLite by default, Postgres-ready |
| AI | OpenAI adapter |
| Tests | pytest |

## Quick Start: Frontend Mock Mode

Use this when you want the fastest visual demo. No backend and no AI key required.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Use this frontend environment:

```text
VITE_USE_REAL_API=false
VITE_API_BASE_URL=http://localhost:8000
```

Open:

```text
http://localhost:5173/
```

## Quick Start: Full Stack Real API Mode

Start the backend:

```bash
cd backend
uv sync --python 3.12
cp .env.example .env
uv run alembic upgrade head
uv run python -m app.cli
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Check the backend:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{"status":"ok","service":"tiezi-backend"}
```

Then start the frontend from the repository root:

```bash
cat > .env.local <<'EOF'
VITE_USE_REAL_API=true
VITE_API_BASE_URL=http://localhost:8000
EOF

npm run dev
```

Open:

```text
http://localhost:5173/home
```

If port `8000` is already in use, run the backend on another port:

```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Then set:

```text
VITE_API_BASE_URL=http://localhost:8001
```

## Environment Variables

### Frontend

```text
VITE_USE_REAL_API=false
VITE_API_BASE_URL=http://localhost:8000
```

### Backend

```text
APP_NAME=Tiezi Backend
APP_ENV=local
DEBUG=true
FRONTEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

DATABASE_URL=sqlite:///./tiezi.db

AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
AI_REQUEST_TIMEOUT_SECONDS=30
AI_TEST_MODE=false
```

For Postgres-compatible environments:

```text
DATABASE_URL=postgresql+psycopg://user:password@host:5432/tiezi
```

Do not commit `.env`, `.env.local`, API keys, local database files, or virtual environments.

## API Contract

The backend implements the endpoints already declared by `src/services/endpoints.ts`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/user/profile` | Return the local beginner user profile |
| GET | `/api/workout/today` | Return today's beginner workout plan |
| GET | `/api/exercises/{exercise_id}` | Return exercise tutorial details |
| POST | `/api/equipment/scan` | Scan equipment from image URL or multipart upload |
| POST | `/api/workout/add-exercise` | Add an exercise to today's workout |
| POST | `/api/workout/log/parse` | Parse a natural-language workout note |
| POST | `/api/workout/log` | Save confirmed set records |

### Equipment Scan: JSON URL

```json
{
  "image_url": "https://example.com/equipment.jpg",
  "user_id": "user_local_001",
  "today_plan_id": "plan_beginner_day_1"
}
```

### Equipment Scan: Multipart

```text
image: Blob
user_id: user_local_001
today_plan_id: plan_beginner_day_1
```

### Workout Log Parse

```json
{
  "user_id": "user_local_001",
  "session_id": "session_local_001",
  "exercise_id": "ex_lat_pulldown",
  "text": "Lat pulldown, three sets, 20 kg, 10, 10, 8. Last set felt hard."
}
```

Parsed results are not saved automatically. The user must confirm or edit the set records first, then call `/api/workout/log`.

## Seed Data

The backend seed command installs a stable MVP dataset:

| Entity | Seeded values |
|---|---|
| User | `user_local_001` |
| Plan | `plan_beginner_day_1` |
| Session | `session_local_001` |
| Equipment | lat pulldown, seated row, chest press, leg press, treadmill, unknown |
| Exercises | treadmill warmup, lat pulldown, chest press, seated row, leg press, plank |

Reset the local SQLite database:

```bash
cd backend
rm -f tiezi.db
uv run alembic upgrade head
uv run python -m app.cli
```

## Repository Layout

```text
.
|-- README.md
|-- package.json
|-- vite.config.ts
|-- src/
|   |-- app/
|   |-- components/
|   |-- data/
|   |-- pages/
|   |-- services/
|   |-- stores/
|   `-- types/
|-- backend/
|   |-- alembic/
|   |-- app/
|   |   |-- ai/
|   |   |-- api/
|   |   |-- core/
|   |   |-- db/
|   |   |-- schemas/
|   |   `-- services/
|   |-- tests/
|   |-- .env.example
|   `-- pyproject.toml
|-- docs/
|   |-- 01-page-design-and-flow.md
|   |-- 02-page-functional-spec.md
|   `-- 03-frontend-architecture-api-plan.md
`-- openspec/
    `-- changes/
        `-- add-fastapi-backend/
```

## Verification

Frontend build:

```bash
npm run build
```

Backend tests:

```bash
cd backend
uv run pytest
```

OpenSpec validation:

```bash
openspec validate add-fastapi-backend --strict --no-interactive
```

Suggested full-stack smoke test:

```text
1. Start the backend.
2. Start the frontend in real API mode.
3. Open /home and confirm today's workout loads from FastAPI.
4. Open /scan and submit an image or image URL.
5. Open /workout/log and parse a natural-language note.
6. Confirm records are shown before saving.
```

## What Makes It Different

| Usual beginner fitness app | Tiezi |
|---|---|
| Starts with heavy onboarding | Lets users skip straight to the gym-floor problem |
| Assumes users know equipment names | Starts from a photo or upload |
| Hides backend readiness behind mocks | Keeps mock mode and real API mode explicit |
| Treats AI output as final | Normalizes AI output and keeps user confirmation in the loop |
| Mixes medical-sounding advice into coaching | Uses beginner-safe safety language and avoids diagnosis |

## Boundaries

Tiezi is an MVP, not a medical product, not a personal trainer replacement, and not a full fitness management platform.

The app currently does not include:

- login or multi-user authentication;
- payment, coaching marketplace, or community features;
- diet management;
- video posture correction;
- medical diagnosis or rehabilitation guidance;
- production deployment hardening.

When the user mentions pain, discomfort, an old injury, or a strain, the backend returns a safety warning that tells the user to stop training and consult a professional. It does not diagnose, treat, or prescribe.

## Documentation

| Document | Purpose |
|---|---|
| `docs/01-page-design-and-flow.md` | Page map and user flow |
| `docs/02-page-functional-spec.md` | Page-level behavior, components, and interactions |
| `docs/03-frontend-architecture-api-plan.md` | Frontend architecture and API plan |
| `backend/README.md` | Backend-specific setup and API notes |
| `openspec/changes/add-fastapi-backend/` | OpenSpec proposal, design, specs, and tasks |

## Star This If

Star this repo if you want a small but serious reference for building an AI-assisted, mobile-first product loop with a clean frontend/backend split, mockable UI flows, SQL persistence, and provider-isolated AI features.
