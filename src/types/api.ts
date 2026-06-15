import type { Equipment } from "./equipment";
import type { SetRecord, WorkoutPlan, WorkoutSession } from "./workout";

export type ScanScenario = "high" | "medium" | "low";

export type TodayRecommendation = {
  recommended: boolean;
  reason: string;
  suggested_sets: number;
  suggested_reps: string;
};

export type RecommendedExercise = {
  exercise_id: string;
  name_cn: string;
  difficulty: "beginner" | "intermediate" | "advanced";
};

export type ScanResult = {
  scan_id?: string;
  image_asset_id?: string;
  image_url?: string;
  created_at?: string;
  recognized: boolean;
  confidence: number;
  equipment: Equipment;
  target_body_parts_beginner: string[];
  target_muscles: string[];
  beginner_friendly: boolean;
  risk_level: "low" | "medium" | "high";
  recommended_exercises: RecommendedExercise[];
  today_recommendation: TodayRecommendation;
  user_facing_summary: string;
  need_more_photo: boolean;
};

export type ParsedWorkoutLog = {
  exercise_name: string;
  exercise_id: string;
  sets: SetRecord[];
  need_confirmation: boolean;
  xiaotie_feedback: string;
  safety_warning?: string;
};

export type AddExerciseResponse = {
  plan_id: string;
  exercise_id: string;
  position: number;
  message: string;
  plan?: WorkoutPlan;
};

export type ReplaceExerciseResponse = {
  plan_id: string;
  from_exercise_id: string;
  to_exercise_id: string;
  message: string;
  plan: WorkoutPlan;
  session?: WorkoutSession | null;
};

export type SaveWorkoutLogResponse = {
  success: boolean;
  saved: number;
  message: string;
  plan?: WorkoutPlan;
  session?: WorkoutSession | null;
};

export type TrainingInsight = {
  insight_id: string;
  session_id: string;
  exercise_id: string;
  set_index: number;
  flags: Array<"pain" | "heavy" | "tired" | "easy" | string>;
  note: string;
  created_at: string;
};

export type BodyPhotoAnalysis = {
  analysis_id: string;
  user_id: string;
  image_asset_id: string;
  image_url: string;
  posture_summary: string;
  focus_areas: Array<{
    body_part: string;
    finding: string;
    priority: "low" | "medium" | "high";
  }>;
  recommended_body_parts: string[];
  recommended_exercises: RecommendedExercise[];
  xiaotie_tip: string;
  privacy_note: string;
  created_at: string;
};

export type AssistantSuggestedAction = {
    type: string;
    from_exercise_id?: string;
    to_exercise_id?: string;
    intensity?: "low" | "medium" | "high";
    label: string;
};

export type AssistantResponse = {
  message_id: string;
  reply: string;
  suggested_actions: AssistantSuggestedAction[];
};

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  message: string;
  created_at: string;
  input_type?: "text" | "voice";
  session_id?: string | null;
  daily_workout_plan_id?: string | null;
  context?: Record<string, unknown>;
  suggested_actions?: AssistantSuggestedAction[];
};

export type AnalyticsCalendarEntry = {
  date: string;
  session_count: number;
  set_count: number;
  total_volume: number;
  body_parts: string[];
  type: "strength" | "mobility" | "cardio";
};

export type AnalyticsCalendar = {
  range: string;
  date: string;
  entries: AnalyticsCalendarEntry[];
};

export type AnalyticsOverview = {
  range: string;
  session_days: number;
  set_count: number;
  total_volume: number;
  duration_minutes: number;
  body_parts: Array<{
    body_part: string;
    focus_score: number;
    set_count: number;
  }>;
  longest_streak_days: number;
  monthly_bars: Array<{
    label: string;
    session_days: number;
    duration_minutes: number;
  }>;
};

export type MediaUploadResponse = {
  asset_id: string;
  url: string;
  mime_type: string;
  purpose: "avatar" | "scan" | "exercise_media" | "body_photo";
};

export type ResetUserResponse = {
  reset: boolean;
  profile: {
    user_id: string;
    nickname: string;
  };
};

export type ScanFeedbackResponse = {
  feedback_id: string;
  message: string;
};
