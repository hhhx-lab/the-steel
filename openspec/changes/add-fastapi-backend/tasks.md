## 1. Backend Foundation

- [ ] 1.1 Create a separate `backend/` FastAPI project with isolated dependency metadata, application entrypoint, CORS settings, health check, and local environment example.
- [ ] 1.2 Add backend configuration for database URL, AI provider credentials, request timeouts, frontend CORS origin, and deterministic test mode.

## 2. Persistence And Seed Data

- [ ] 2.1 Implement SQLAlchemy-compatible database models, session management, and migrations for users, equipment, exercises, workout plans, workout-plan exercises, workout sessions, and set records.
- [ ] 2.2 Add backend-owned seed data matching the current frontend mock catalog and stable IDs such as `user_local_001` and `plan_beginner_day_1`.
- [ ] 2.3 Add repository/service functions that read the default profile, today workout, exercise details, plan exercises, and saved set records through the SQL data layer.

## 3. Contract API Routes

- [ ] 3.1 Implement Pydantic request and response schemas that mirror the existing frontend TypeScript API contracts.
- [ ] 3.2 Implement read endpoints for `GET /api/user/profile`, `GET /api/workout/today`, and `GET /api/exercises/:exerciseId`, including controlled 404 responses.
- [ ] 3.3 Implement workout mutation endpoints for `POST /api/workout/add-exercise` and `POST /api/workout/log`, ensuring changes persist and later reads reflect them.

## 4. Real AI Adapters

- [ ] 4.1 Implement a real AI equipment-recognition adapter that accepts multipart image uploads and JSON image URLs, calls the configured provider, validates output, and normalizes high- and low-confidence scan responses.
- [ ] 4.2 Implement a real AI workout-log parsing adapter that calls the configured provider, normalizes parsed set records, requires user confirmation, and emits beginner-safe safety warnings for pain or injury language.

## 5. Frontend Integration

- [ ] 5.1 Update frontend environment examples and integration documentation for running the React app against the FastAPI backend in real API mode.
- [ ] 5.2 Apply any minimal frontend API compatibility fixes needed so `VITE_USE_REAL_API=true` can complete the welcome, scan, result, tutorial, workout session, and workout log flow without page rewrites.

## 6. Verification

- [ ] 6.1 Add backend unit and API tests covering schema compatibility, seeded data, persistence, AI adapter normalization, low-confidence scan handling, and safety-warning behavior.
- [ ] 6.2 Run backend tests, frontend build, OpenSpec validation, and a local front/back integration smoke check; document any real-AI manual verification steps that require credentials.
