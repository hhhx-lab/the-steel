import type { WorkoutPlan } from "../types/workout";

export const mockWorkoutPlan: WorkoutPlan = {
  plan_id: "plan_beginner_day_1",
  user_id: "user_local_001",
  plan_type: "full_body_beginner",
  duration_minutes: 20,
  title: "新手入门计划 · 第 1 次",
  subtitle: "全身入门训练",
  intensity: "medium",
  exercises: [
    { exercise_id: "ex_treadmill_warmup", sets: 1, reps: "5 分钟", weight_strategy: "trial_based", status: "current" },
    { exercise_id: "ex_lat_pulldown", sets: 3, reps: "10", weight_strategy: "trial_based", status: "pending" },
    { exercise_id: "ex_chest_press", sets: 3, reps: "10", weight_strategy: "trial_based", status: "pending" },
    { exercise_id: "ex_leg_press", sets: 3, reps: "10", weight_strategy: "trial_based", status: "pending" },
    { exercise_id: "ex_plank", sets: 2, reps: "20 秒", weight_strategy: "trial_based", status: "pending" }
  ]
};
