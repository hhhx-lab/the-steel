## Context

Tiezi currently has a React/Vite frontend with a service boundary that can switch from local mocks to real APIs through `VITE_USE_REAL_API`. The backend does not exist yet, but endpoint names, request shapes, response shapes, and frontend TypeScript models already exist. The backend must therefore be contract-first: implement the current `realApi.ts` expectations before expanding product scope.

The plan fixes three major choices: Python + FastAPI, SQL persistence with SQLite/Postgres compatibility, and direct integration with a real AI service for image recognition and natural-language workout log parsing.

## Goals / Non-Goals

**Goals:**

- Provide a FastAPI backend that implements all endpoints currently declared in `src/services/endpoints.ts`.
- Persist MVP data in SQL tables for users, equipment, exercises, workout plans, plan exercises, sessions, and set records.
- Seed local data equivalent to the current frontend mock catalog and default workout plan.
- Integrate a real AI service through a backend adapter for equipment recognition and workout-log parsing.
- Keep frontend page code stable by preserving the existing real API contract and environment switch.

**Non-Goals:**

- No login, JWT authentication, multi-tenant account model, payments, community, diet management, production deployment, or medical diagnosis.
- No rewrite of the current V1 React UI.
- No direct frontend dependency on backend internals; frontend continues to use `tieziApi.ts`.

## Decisions

### Decision: Use `backend/` as a separate FastAPI application

The backend will live under a dedicated `backend/` directory with its own Python dependency metadata, app entrypoint, routers, schemas, database layer, AI adapter, and tests.

Rationale: the current repository is a frontend Vite app. Keeping backend code under `backend/` preserves front/back separation and avoids mixing Python runtime files with React source modules.

Alternative considered: add API handlers inside the Vite app. This was rejected because Vite is not the target backend runtime and would not provide a clean FastAPI boundary.

### Decision: Use Pydantic schemas mirroring existing TypeScript contracts

Backend response schemas will mirror `UserProfile`, `Equipment`, `Exercise`, `WorkoutPlan`, `SetRecord`, `ScanResult`, `ParsedWorkoutLog`, `AddExerciseResponse`, and `SaveWorkoutLogResponse`.

Rationale: frontend compatibility is the primary acceptance criterion. Schema mirroring lets tests assert that backend JSON is usable by the current `realApi.ts` without page rewrites.

Alternative considered: redesign API response contracts. This was rejected for the first backend phase because it would force unnecessary frontend churn.

### Decision: Use SQLAlchemy-compatible persistence with local SQLite and Postgres-ready `DATABASE_URL`

The backend will use a database URL configuration that defaults to SQLite for local development and supports Postgres for longer-running environments. Migrations should be managed through Alembic or an equivalent migration tool.

Rationale: SQLite keeps local setup fast while Postgres compatibility avoids painting the project into a local-only corner.

Alternative considered: JSON-file persistence. This was rejected because the user requested SQLite/Postgres persistence and because workout records need relational integrity.

### Decision: Seed the MVP catalog from backend-owned seed data

The backend will own seed data for default user, equipment, exercises, and today workout plan. Seeded values should match current mock IDs such as `user_local_001`, `plan_beginner_day_1`, and the existing exercise/equipment IDs.

Rationale: the frontend currently relies on stable IDs. Keeping IDs stable allows the backend to replace mocks without breaking existing flows.

Alternative considered: load TypeScript mock files from Python. This was rejected because it creates cross-runtime coupling.

### Decision: Wrap the real AI service behind a small adapter interface

The backend will expose two adapter operations: equipment scan from image content or image URL, and workout-log parse from text plus exercise context. The adapter output must be normalized into backend Pydantic schemas before returning to the frontend.

Rationale: the repository does not currently define a provider, but the user requires real AI service usage. An adapter makes provider details explicit in backend config while keeping routes and tests stable.

Alternative considered: let routes call an AI SDK directly. This was rejected because it makes validation, fallback behavior, and provider replacement harder.

### Decision: Keep mock fallback in the frontend, not as the backend primary behavior

The frontend can still use `VITE_USE_REAL_API=false` for demos. The backend itself must call the real AI adapter for scan/parse flows when configured. Automated tests may use a stub adapter, but production/local real mode should not silently use frontend mock logic.

Rationale: this preserves the existing demo fallback while satisfying the requirement to connect a real AI service.

## Risks / Trade-offs

- [Risk] Real AI output may be incomplete, unsafe, or not valid JSON. → Mitigation: validate and normalize AI output with Pydantic, map unsafe/low-confidence results to controlled responses, and keep pain/injury keyword fallback.
- [Risk] AI credentials may be missing in local environments. → Mitigation: fail fast with documented config errors for real calls; use explicit stub adapter only in tests.
- [Risk] Database migrations can break local data. → Mitigation: provide migration files, seed commands, and rollback guidance; frontend can switch back to mock mode during recovery.
- [Risk] Existing frontend hardcodes local IDs. → Mitigation: seed stable IDs and keep first-phase no-auth boundary explicit.
- [Trade-off] SQLite default accelerates local development but does not fully represent production concurrency. → Mitigation: keep SQLAlchemy/Postgres compatibility and run database tests against SQLite plus optional Postgres when available.

## Migration Plan

- Introduce backend schema migrations for the MVP data model before enabling real API mode.
- Seed local catalog and default workout data after migrations.
- Document local environment variables for database URL, AI provider credentials, and frontend `VITE_API_BASE_URL`.
- Roll back by reverting migrations where possible and switching the frontend back to `VITE_USE_REAL_API=false`.

## Open Questions

- Which concrete AI provider and model should be the default real adapter? The plan requires a real provider, but the repository does not yet contain provider credentials or SDK conventions.
