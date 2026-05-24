import type { ScanScenario } from "../types/api";
import { mockApi } from "./mockApi";
import { realApi } from "./realApi";

const useRealApi = import.meta.env.VITE_USE_REAL_API === "true";

export const tieziApi = useRealApi ? realApi : mockApi;

export type { ScanScenario };
export const getUserProfile = tieziApi.getUserProfile;
export const getTodayWorkout = tieziApi.getTodayWorkout;
export const getExerciseDetail = tieziApi.getExerciseDetail;
export const scanEquipment = tieziApi.scanEquipment;
export const addExerciseToWorkout = tieziApi.addExerciseToWorkout;
export const parseWorkoutLog = tieziApi.parseWorkoutLog;
export const saveWorkoutLog = tieziApi.saveWorkoutLog;
