export type ExperienceLevel = "newbie" | "beginner" | "intermediate";
export type FitnessGoal = "fat_loss" | "muscle_gain" | "shape";
export type SplitPreference = "two" | "three" | "four";

export type UserProfile = {
  user_id: string;
  nickname: string;
  avatar_url?: string;
  experience_level: ExperienceLevel;
  fitness_goal?: FitnessGoal;
  split_preference?: SplitPreference;
  weekly_frequency?: number;
  focus_body_parts?: string[];
  today_focus_part?: string;
  training_profile_completed?: boolean;
  onboarding_completed: boolean;
  allow_body_photo_analysis: boolean;
  home_guide_seen?: boolean;
};

export type TrainingPlan = {
  training_plan_id: string;
  summary: string;
  fitness_goal: FitnessGoal;
  split_preference: SplitPreference;
  weekly_frequency: number;
  focus_body_parts: string[];
  weekly_structure: string[];
  today_generation_hint: string;
  updated_at: string;
};
