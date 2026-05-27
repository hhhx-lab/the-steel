## ADDED Requirements

### Requirement: Backend exposes the frontend API contract
The system SHALL provide a FastAPI backend implementing the HTTP endpoints currently declared by the frontend real API layer.

#### Scenario: User profile is available
- **WHEN** the frontend requests `GET /api/user/profile`
- **THEN** the backend returns a JSON response containing `user_id`, `nickname`, `experience_level`, `onboarding_completed`, and `allow_body_photo_analysis`

#### Scenario: Today workout is available
- **WHEN** the frontend requests `GET /api/workout/today`
- **THEN** the backend returns a workout plan containing `plan_id`, `user_id`, `plan_type`, `duration_minutes`, `title`, `subtitle`, `intensity`, and an `exercises` array

#### Scenario: Exercise detail is available
- **WHEN** the frontend requests `GET /api/exercises/:exerciseId` for a known exercise
- **THEN** the backend returns an exercise object compatible with the frontend `Exercise` type

#### Scenario: Unknown exercise is rejected
- **WHEN** the frontend requests `GET /api/exercises/:exerciseId` for an unknown exercise
- **THEN** the backend returns a 404 response with a controlled error body

### Requirement: Backend preserves frontend request shapes
The system SHALL accept the request payloads already emitted by `src/services/realApi.ts`.

#### Scenario: Scan accepts multipart image upload
- **WHEN** `POST /api/equipment/scan` receives `multipart/form-data` containing `image`, `user_id`, and `today_plan_id`
- **THEN** the backend processes the uploaded image and returns a scan result response

#### Scenario: Scan accepts JSON image URL
- **WHEN** `POST /api/equipment/scan` receives JSON containing `image_url`, `user_id`, and `today_plan_id`
- **THEN** the backend processes the image URL and returns the same scan result contract as the upload path

#### Scenario: Workout log parse accepts text payload
- **WHEN** `POST /api/workout/log/parse` receives `user_id`, `session_id`, `exercise_id`, and `text`
- **THEN** the backend returns a parsed workout log response

#### Scenario: Workout log save accepts records payload
- **WHEN** `POST /api/workout/log` receives `user_id`, `session_id`, and `records`
- **THEN** the backend saves the records and returns `success`, `saved`, and `message`

### Requirement: Backend supports frontend real API mode
The system SHALL allow the current frontend to complete the MVP flow when `VITE_USE_REAL_API=true` and `VITE_API_BASE_URL` points to the FastAPI service.

#### Scenario: Frontend runs against real API
- **WHEN** the backend is running and the frontend is configured for real API mode
- **THEN** the user can navigate welcome, home, scan, result, exercise, workout session, and workout log pages without depending on frontend mock services

#### Scenario: Frontend build remains valid
- **WHEN** backend integration changes are complete
- **THEN** `npm run build` completes successfully
