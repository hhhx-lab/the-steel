## ADDED Requirements

### Requirement: Backend uses real AI for natural-language workout log parsing
The system SHALL call a configured real AI service to parse natural-language workout notes into structured set records.

#### Scenario: Workout log text is parsed into sets
- **WHEN** the backend receives text such as "高位下拉做了三组，20 公斤，10、10、8"
- **THEN** the backend returns `exercise_name`, `exercise_id`, `sets`, `need_confirmation: true`, and `xiaotie_feedback`

#### Scenario: Parsed sets match frontend record contract
- **WHEN** the backend returns parsed workout sets
- **THEN** each set contains `record_id`, `session_id`, `exercise_id`, `set_index`, `weight`, `weight_unit`, and `reps`

### Requirement: Backend validates AI workout-log output
The system SHALL validate and normalize AI parsed output before returning it to the frontend.

#### Scenario: AI parse output is incomplete
- **WHEN** the AI service returns incomplete set data
- **THEN** the backend returns a controlled response requiring user confirmation or correction rather than saving invalid records

#### Scenario: Unknown exercise text is parsed
- **WHEN** user text references an exercise that cannot be matched to the backend exercise catalog
- **THEN** the backend returns a controlled parse response that does not silently attach records to the wrong exercise

### Requirement: Backend emits safety warnings for pain and injury language
The system SHALL detect pain, discomfort, old injury, or strain language and return a beginner-safe warning.

#### Scenario: Pain keyword triggers safety warning
- **WHEN** workout log text contains pain, discomfort, old injury, or strain language
- **THEN** the backend returns `safety_warning` instructing the user to stop and consult a professional

#### Scenario: Safety warning does not diagnose
- **WHEN** the backend returns `safety_warning`
- **THEN** the message does not provide medical diagnosis or treatment instructions
