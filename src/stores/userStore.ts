import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "../types/user";

type UserState = {
  hasVisited: boolean;
  profile: UserProfile;
  setHasVisited: (value: boolean) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  clearUserData: () => void;
};

const defaultProfile: UserProfile = {
  user_id: "user_local_001",
  nickname: "新手铁友",
  experience_level: "newbie",
  training_profile_completed: false,
  onboarding_completed: false,
  allow_body_photo_analysis: false,
  home_guide_seen: false
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      hasVisited: false,
      profile: defaultProfile,
      setHasVisited: (value) => set({ hasVisited: value }),
      updateProfile: (profile) =>
        set((state) => ({
          profile: { ...state.profile, ...profile }
        })),
      clearUserData: () => set({ hasVisited: false, profile: defaultProfile })
    }),
    {
      name: "tiezi-user"
    }
  )
);
