import type { AddExerciseResponse, ParsedWorkoutLog, SaveWorkoutLogResponse, ScanResult, ScanScenario } from "../types/api";
import type { Exercise } from "../types/exercise";
import type { SetRecord, WorkoutPlan } from "../types/workout";
import type { UserProfile } from "../types/user";
import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";

type ApiEnvelope<T> = {
  success?: boolean;
  data: T;
};

const unwrap = <T>(payload: T | ApiEnvelope<T>): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
};

export async function getUserProfile(): Promise<UserProfile> {
  return unwrap(await apiClient.get<UserProfile | ApiEnvelope<UserProfile>>(endpoints.userProfile));
}

export async function getTodayWorkout(): Promise<WorkoutPlan> {
  return unwrap(await apiClient.get<WorkoutPlan | ApiEnvelope<WorkoutPlan>>(endpoints.todayWorkout));
}

export async function getExerciseDetail(exerciseId: string): Promise<Exercise> {
  return unwrap(await apiClient.get<Exercise | ApiEnvelope<Exercise>>(endpoints.exerciseDetail(exerciseId)));
}

export async function scanEquipment(image: Blob | string, _scenario?: ScanScenario): Promise<ScanResult> {
  if (typeof image === "string") {
    return unwrap(
      await apiClient.post<ScanResult | ApiEnvelope<ScanResult>>(endpoints.scanEquipment, {
        image_url: image,
        user_id: "user_local_001",
        today_plan_id: "plan_beginner_day_1"
      })
    );
  }

  const formData = new FormData();
  formData.append("image", image, "equipment.jpg");
  formData.append("user_id", "user_local_001");
  formData.append("today_plan_id", "plan_beginner_day_1");
  return unwrap(await apiClient.postForm<ScanResult | ApiEnvelope<ScanResult>>(endpoints.scanEquipment, formData));
}

export async function addExerciseToWorkout(exerciseId: string): Promise<AddExerciseResponse> {
  return unwrap(
    await apiClient.post<AddExerciseResponse | ApiEnvelope<AddExerciseResponse>>(endpoints.addExercise, {
      user_id: "user_local_001",
      plan_id: "plan_beginner_day_1",
      exercise_id: exerciseId
    })
  );
}

export async function parseWorkoutLog(text: string, exerciseId: string): Promise<ParsedWorkoutLog> {
  return unwrap(
    await apiClient.post<ParsedWorkoutLog | ApiEnvelope<ParsedWorkoutLog>>(endpoints.parseWorkoutLog, {
      user_id: "user_local_001",
      session_id: "session_local_001",
      exercise_id: exerciseId,
      text
    })
  );
}

export async function saveWorkoutLog(records: SetRecord[]): Promise<SaveWorkoutLogResponse> {
  return unwrap(
    await apiClient.post<SaveWorkoutLogResponse | ApiEnvelope<SaveWorkoutLogResponse>>(endpoints.saveWorkoutLog, {
      user_id: "user_local_001",
      session_id: "session_local_001",
      records
    })
  );
}

export const realApi = {
  getUserProfile,
  getTodayWorkout,
  getExerciseDetail,
  scanEquipment,
  addExerciseToWorkout,
  parseWorkoutLog,
  saveWorkoutLog
};
