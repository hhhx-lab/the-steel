import type { Equipment } from "./equipment";
import type { SetRecord } from "./workout";

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
};

export type SaveWorkoutLogResponse = {
  success: boolean;
  saved: number;
  message: string;
};
