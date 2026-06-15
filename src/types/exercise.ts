export type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";

export type Exercise = {
  exercise_id: string;
  name_cn: string;
  equipment_id: string;
  beginner_explanation: string;
  target_body_parts_beginner: string[];
  difficulty: ExerciseDifficulty;
  steps: string[];
  setup_tips: string[];
  common_mistakes: string[];
  safety_notes: string[];
  default_sets: number;
  default_reps: string;
  media_hint: string;
  video_url?: string;
  thumbnail_url?: string;
};
