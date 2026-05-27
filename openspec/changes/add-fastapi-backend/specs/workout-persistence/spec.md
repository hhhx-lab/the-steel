## ADDED Requirements

### Requirement: Backend persists MVP catalog data
The system SHALL store users, equipment, exercises, workout plans, and workout-plan exercises in SQL-backed persistence.

#### Scenario: Seeded catalog exists after setup
- **WHEN** the backend database is initialized and seeded
- **THEN** the default user, equipment catalog, exercise catalog, and default beginner workout plan are available through backend APIs

#### Scenario: Seeded IDs remain frontend-compatible
- **WHEN** seeded data is returned by backend APIs
- **THEN** IDs used by the frontend MVP, including `user_local_001` and `plan_beginner_day_1`, remain stable

### Requirement: Backend persists workout plan changes
The system SHALL persist additions to the user's today workout plan.

#### Scenario: Exercise is added to today workout
- **WHEN** `POST /api/workout/add-exercise` receives a valid `user_id`, `plan_id`, and `exercise_id`
- **THEN** the backend stores the exercise in the workout plan and returns `plan_id`, `exercise_id`, `position`, and `message`

#### Scenario: Added exercise appears in later reads
- **WHEN** an exercise has been added to a workout plan
- **THEN** a later `GET /api/workout/today` response includes that exercise in the plan

### Requirement: Backend persists workout set records
The system SHALL persist confirmed workout set records by session and exercise.

#### Scenario: Set records are saved
- **WHEN** `POST /api/workout/log` receives valid set records
- **THEN** the backend stores those records and returns the number of saved records

#### Scenario: Saved records are queryable for verification
- **WHEN** set records have been saved
- **THEN** backend tests or database queries can find them by `session_id` and `exercise_id`

### Requirement: Backend supports SQLite and Postgres-compatible configuration
The system SHALL use a database configuration that supports local SQLite and Postgres-compatible deployment.

#### Scenario: Local SQLite database works
- **WHEN** no deployment database URL is provided
- **THEN** the backend can run with a local SQLite database

#### Scenario: Database URL can target Postgres
- **WHEN** a Postgres database URL is configured
- **THEN** the backend uses the same data access layer and migrations against that database
