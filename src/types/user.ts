export type ExperienceLevel = "newbie" | "beginner" | "intermediate";

export type UserProfile = {
  user_id: string;
  nickname: string;
  experience_level: ExperienceLevel;
  onboarding_completed: boolean;
  allow_body_photo_analysis: boolean;
};
