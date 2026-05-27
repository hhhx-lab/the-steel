## ADDED Requirements

### Requirement: Backend uses real AI for equipment recognition
The system SHALL call a configured real AI service to identify gym equipment from an uploaded image or image URL.

#### Scenario: High-confidence equipment scan returns structured result
- **WHEN** the backend receives a clear equipment image and the AI service returns a high-confidence match
- **THEN** the backend returns `recognized: true`, `confidence`, `equipment`, `target_body_parts_beginner`, `target_muscles`, `beginner_friendly`, `risk_level`, `recommended_exercises`, `today_recommendation`, `user_facing_summary`, and `need_more_photo: false`

#### Scenario: Low-confidence equipment scan requests another photo
- **WHEN** the AI service cannot identify equipment above the low-confidence threshold
- **THEN** the backend returns a response with `need_more_photo: true` and does not return a definitive exercise recommendation

### Requirement: Backend normalizes AI scan output
The system SHALL validate and normalize AI scan output before sending it to the frontend.

#### Scenario: AI output references known equipment
- **WHEN** the AI service returns an equipment match that exists in the backend catalog
- **THEN** the backend returns the catalog-backed equipment and compatible recommended exercise data

#### Scenario: AI output is malformed
- **WHEN** the AI service returns malformed or incomplete output
- **THEN** the backend returns a controlled low-confidence or error response without crashing the frontend

### Requirement: Backend keeps scan responses safe for beginners
The system SHALL avoid medical diagnosis or unsafe certainty in equipment scan responses.

#### Scenario: Scan response uses beginner-safe summary
- **WHEN** the backend returns a recognized equipment scan result
- **THEN** `user_facing_summary` explains the equipment in beginner-safe language without medical diagnosis

#### Scenario: Scan service is unavailable
- **WHEN** the configured AI service is unavailable or times out
- **THEN** the backend returns a controlled failure or low-confidence response that the frontend can render
