export type WorkoutSessionStatus =
  | "not_started"
  | "in_progress"
  | "logging"
  | "completed"
  | "abandoned";

export type WorkoutExerciseStatus = "pending" | "current" | "completed" | "skipped";

export type WorkoutPlanExercise = {
  exercise_id: string;
  sets: number;
  reps: string;
  weight_strategy: "trial_based";
  status: WorkoutExerciseStatus;
};

export type WorkoutPlan = {
  plan_id: string;
  user_id: string;
  plan_type: "full_body_beginner";
  duration_minutes: number;
  title: string;
  subtitle: string;
  intensity: "low" | "medium" | "high";
  exercises: WorkoutPlanExercise[];
  today_focus_part?: string;
  today_focus_parts?: string[];
  status?: "draft" | "confirmed" | "in_progress" | "completed" | "abandoned";
  generated_reason?: string;
};

export type SetRecord = {
  record_id: string;
  session_id: string;
  exercise_id: string;
  set_index: number;
  weight: number;
  weight_unit: "kg";
  reps: number;
  duration_minutes?: number;
  distance_km?: number;
  rpe_text?: string;
  user_note?: string;
};

export type WorkoutSession = {
  session_id: string;
  user_id: string;
  daily_workout_plan_id: string;
  status: Exclude<WorkoutSessionStatus, "not_started" | "logging">;
  current_exercise_id?: string;
  started_at: string;
  ended_at?: string | null;
  last_feedback?: string | null;
};

export type WorkoutSessionSummary = WorkoutSession & {
  set_count: number;
  total_volume: number;
  duration_minutes: number;
  exercise_ids: string[];
  body_parts: string[];
};
