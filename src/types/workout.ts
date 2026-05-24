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
};

export type SetRecord = {
  record_id: string;
  session_id: string;
  exercise_id: string;
  set_index: number;
  weight: number;
  weight_unit: "kg";
  reps: number;
  rpe_text?: string;
  user_note?: string;
};
