import { findExercise } from "./mockExercises";
import type { WorkoutPlanExercise } from "../types/workout";

export const bodyParts = ["背部", "胸部", "腿臀", "肩臂", "核心"];
export const todayParts = ["背部", "胸部", "腿臀", "肩臂", "核心", "全身"];

const todayExerciseIds: Record<string, string[]> = {
  背部: ["ex_treadmill_warmup", "ex_lat_pulldown", "ex_seated_row", "ex_plank"],
  胸部: ["ex_treadmill_warmup", "ex_chest_press", "ex_plank"],
  腿臀: ["ex_treadmill_warmup", "ex_leg_press", "ex_plank"],
  肩臂: ["ex_treadmill_warmup", "ex_chest_press", "ex_seated_row", "ex_plank"],
  核心: ["ex_treadmill_warmup", "ex_plank", "ex_seated_row"],
  全身: ["ex_treadmill_warmup", "ex_lat_pulldown", "ex_chest_press", "ex_leg_press", "ex_plank"]
};

export const formatBodyPartList = (parts?: string[]) => (parts?.length ? parts.join("、") : "全身");

export const normalizeBodyParts = (part?: string | string[]) => {
  if (Array.isArray(part)) return part.length ? part : ["全身"];
  if (!part) return ["全身"];
  return part.split(/[、/,，\s]+/).filter(Boolean);
};

export const getTodayExerciseIds = (part?: string | string[]) => {
  const parts = normalizeBodyParts(part);
  const selectedParts = parts.includes("全身") ? ["全身"] : parts;
  const merged = selectedParts.flatMap((item) => todayExerciseIds[item] ?? []);
  return Array.from(new Set(merged.length ? merged : todayExerciseIds["全身"]));
};

export const createPlanExercises = (exerciseIds: string[]): WorkoutPlanExercise[] =>
  exerciseIds.map((exerciseId, index) => {
    const exercise = findExercise(exerciseId);
    return {
      exercise_id: exercise.exercise_id,
      sets: exercise.default_sets,
      reps: exercise.default_reps,
      weight_strategy: "trial_based",
      status: index === 0 ? "current" : "pending"
    };
  });

export const getTodayPlanTitle = (part?: string | string[]) => `${formatBodyPartList(normalizeBodyParts(part))}入门训练`;
