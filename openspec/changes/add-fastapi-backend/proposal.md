## Why

Tiezi is currently a frontend-only MVP that can complete the gym onboarding loop through local mock services. A real backend is now needed so the existing React app can switch from `mockApi` to `realApi`, persist workout state, and use real AI for equipment recognition and workout-log parsing.

## What Changes

- Add a Python + FastAPI backend that implements the existing frontend API contract declared in `src/services/endpoints.ts` and consumed by `src/services/realApi.ts`.
- Add SQL persistence for the local MVP user, equipment catalog, exercise catalog, today workout plan, workout-plan exercises, sessions, and set records.
- Add a real AI service integration layer for equipment image recognition and natural-language workout-log parsing, with backend-side schema validation and safe fallback behavior.
- Add backend tests and local run configuration so the frontend can be verified with `VITE_USE_REAL_API=true`.
- Preserve the current V1 React UI and page flow; frontend changes are limited to environment/docs or minimal `realApi` compatibility fixes if required.

## Capabilities

### New Capabilities

- `backend-api`: Covers the FastAPI HTTP contract required by the existing frontend real API layer.
- `workout-persistence`: Covers SQL persistence for users, exercises, equipment, workout plans, plan exercises, sessions, and set records.
- `ai-equipment-recognition`: Covers real AI-backed equipment scan behavior and scan-result normalization.
- `ai-workout-log-parse`: Covers real AI-backed parsing of natural-language workout logs and safety-warning extraction.

### Modified Capabilities

- None. There are no existing OpenSpec specs in this repository.

## Impact

- Affected backend code: new FastAPI app, routes, schemas, database models, migration/seed setup, AI service adapter, and backend tests.
- Affected frontend integration: existing `src/services/realApi.ts`, `src/services/endpoints.ts`, `.env.example`, README/docs for real API mode.
- Affected APIs: `GET /api/user/profile`, `GET /api/workout/today`, `POST /api/equipment/scan`, `GET /api/exercises/:exerciseId`, `POST /api/workout/add-exercise`, `POST /api/workout/log/parse`, `POST /api/workout/log`.
- Affected dependencies: Python backend dependencies for FastAPI, SQL persistence, migrations, testing, and the chosen real AI service provider SDK or HTTP client.
- Risks: real AI responses may be unstructured or unavailable; SQL schema migration requires rollback; frontend must keep working in mock mode as a fallback.
