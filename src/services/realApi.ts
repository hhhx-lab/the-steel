import type {
  AddExerciseResponse,
  AnalyticsCalendar,
  AnalyticsOverview,
  AssistantMessage,
  AssistantResponse,
  BodyPhotoAnalysis,
  MediaUploadResponse,
  ParsedWorkoutLog,
  ReplaceExerciseResponse,
  ResetUserResponse,
  SaveWorkoutLogResponse,
  ScanFeedbackResponse,
  ScanResult,
  ScanScenario,
  TrainingInsight
} from "../types/api";
import type { Exercise } from "../types/exercise";
import type { SetRecord, WorkoutPlan, WorkoutSession, WorkoutSessionSummary } from "../types/workout";
import type { FitnessGoal, SplitPreference, TrainingPlan, UserProfile } from "../types/user";
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

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  return unwrap(await apiClient.patch<UserProfile | ApiEnvelope<UserProfile>>(endpoints.userProfile, profile));
}

export async function resetUserData(): Promise<ResetUserResponse> {
  return unwrap(await apiClient.post<ResetUserResponse | ApiEnvelope<ResetUserResponse>>(endpoints.resetUser, { user_id: "user_local_001" }));
}

export async function saveTrainingProfile(payload: {
  fitness_goal: FitnessGoal;
  split_preference: SplitPreference;
  weekly_frequency: number;
  focus_body_parts: string[];
  experience_level?: UserProfile["experience_level"];
}): Promise<TrainingPlan & { profile_saved: boolean }> {
  return unwrap(await apiClient.post<TrainingPlan & { profile_saved: boolean } | ApiEnvelope<TrainingPlan & { profile_saved: boolean }>>(endpoints.trainingProfile, payload));
}

export async function getCurrentTrainingPlan(): Promise<TrainingPlan> {
  return unwrap(await apiClient.get<TrainingPlan | ApiEnvelope<TrainingPlan>>(endpoints.currentTrainingPlan));
}

export async function getTodayWorkout(): Promise<WorkoutPlan> {
  return unwrap(await apiClient.get<WorkoutPlan | ApiEnvelope<WorkoutPlan>>(endpoints.todayWorkout));
}

export async function generateTodayWorkout(payload: { today_focus_part: string; today_focus_parts?: string[]; duration_minutes: number; intensity: WorkoutPlan["intensity"] }): Promise<WorkoutPlan> {
  return unwrap(await apiClient.post<WorkoutPlan | ApiEnvelope<WorkoutPlan>>(endpoints.generateTodayWorkout, payload));
}

export async function updateTodayExercises(planId: string, exerciseIds: string[]): Promise<WorkoutPlan> {
  return unwrap(
    await apiClient.patch<WorkoutPlan | ApiEnvelope<WorkoutPlan>>(endpoints.updateTodayExercises, {
      plan_id: planId,
      exercise_ids: exerciseIds
    })
  );
}

export async function adjustWorkoutIntensity(planId: string, intensity: WorkoutPlan["intensity"], sessionId?: string): Promise<SaveWorkoutLogResponse> {
  return unwrap(
    await apiClient.patch<SaveWorkoutLogResponse | ApiEnvelope<SaveWorkoutLogResponse>>(endpoints.adjustWorkoutIntensity, {
      plan_id: planId,
      session_id: sessionId,
      intensity
    })
  );
}

export async function createWorkoutSession(planId: string, initialExerciseId?: string): Promise<WorkoutSession> {
  return unwrap(
    await apiClient.post<WorkoutSession | ApiEnvelope<WorkoutSession>>(endpoints.workoutSessions, {
      daily_workout_plan_id: planId,
      initial_exercise_id: initialExerciseId
    })
  );
}

export async function getCurrentWorkoutSession(): Promise<WorkoutSession | null> {
  return unwrap(await apiClient.get<WorkoutSession | null | ApiEnvelope<WorkoutSession | null>>(endpoints.currentWorkoutSession));
}

export async function getWorkoutSessions(): Promise<WorkoutSessionSummary[]> {
  return unwrap(await apiClient.get<WorkoutSessionSummary[] | ApiEnvelope<WorkoutSessionSummary[]>>(endpoints.workoutSessionHistory));
}

export async function endCurrentWorkoutSession(): Promise<WorkoutSession | null> {
  return unwrap(await apiClient.patch<WorkoutSession | null | ApiEnvelope<WorkoutSession | null>>(endpoints.endCurrentWorkoutSession, {}));
}

export async function updateCurrentExercise(exerciseId: string, sessionId?: string): Promise<WorkoutSession | null> {
  return unwrap(
    await apiClient.patch<WorkoutSession | null | ApiEnvelope<WorkoutSession | null>>(endpoints.updateCurrentExercise, {
      session_id: sessionId,
      exercise_id: exerciseId
    })
  );
}

export async function getExercises(): Promise<Exercise[]> {
  return unwrap(await apiClient.get<Exercise[] | ApiEnvelope<Exercise[]>>(endpoints.exercises));
}

export async function getExerciseDetail(exerciseId: string): Promise<Exercise> {
  return unwrap(await apiClient.get<Exercise | ApiEnvelope<Exercise>>(endpoints.exerciseDetail(exerciseId)));
}

export async function scanEquipment(image: Blob | string, scenario?: ScanScenario, todayPlanId?: string): Promise<ScanResult> {
  if (typeof image === "string") {
    return unwrap(
      await apiClient.post<ScanResult | ApiEnvelope<ScanResult>>(endpoints.scanEquipment, {
        image_url: image,
        user_id: "user_local_001",
        today_plan_id: todayPlanId,
        scenario
      })
    );
  }

  const formData = new FormData();
  formData.append("image", image, "equipment.jpg");
  formData.append("user_id", "user_local_001");
  if (todayPlanId) formData.append("today_plan_id", todayPlanId);
  if (scenario) formData.append("scenario", scenario);
  return unwrap(await apiClient.postForm<ScanResult | ApiEnvelope<ScanResult>>(endpoints.scanEquipment, formData));
}

export async function getLatestScanResult(): Promise<ScanResult | null> {
  return unwrap(await apiClient.get<ScanResult | null | ApiEnvelope<ScanResult | null>>(endpoints.latestScanResult));
}

export async function submitScanFeedback(payload: { feedback: string; actual_equipment_name?: string; scan_result?: ScanResult }): Promise<ScanFeedbackResponse> {
  return unwrap(
    await apiClient.post<ScanFeedbackResponse | ApiEnvelope<ScanFeedbackResponse>>(endpoints.scanFeedback, {
      user_id: "user_local_001",
      ...payload
    })
  );
}

export async function addExerciseToWorkout(exerciseId: string, planId?: string): Promise<AddExerciseResponse> {
  return unwrap(
    await apiClient.post<AddExerciseResponse | ApiEnvelope<AddExerciseResponse>>(endpoints.addExercise, {
      user_id: "user_local_001",
      plan_id: planId,
      exercise_id: exerciseId
    })
  );
}

export async function replaceExerciseInWorkout(fromExerciseId: string, toExerciseId: string, planId?: string): Promise<ReplaceExerciseResponse> {
  return unwrap(
    await apiClient.post<ReplaceExerciseResponse | ApiEnvelope<ReplaceExerciseResponse>>(endpoints.replaceExercise, {
      user_id: "user_local_001",
      plan_id: planId,
      from_exercise_id: fromExerciseId,
      to_exercise_id: toExerciseId
    })
  );
}

export async function parseWorkoutLog(text: string, exerciseId: string, sessionId?: string): Promise<ParsedWorkoutLog> {
  return unwrap(
    await apiClient.post<ParsedWorkoutLog | ApiEnvelope<ParsedWorkoutLog>>(endpoints.parseWorkoutLog, {
      user_id: "user_local_001",
      session_id: sessionId,
      exercise_id: exerciseId,
      text
    })
  );
}

export async function saveWorkoutLog(records: SetRecord[]): Promise<SaveWorkoutLogResponse> {
  return unwrap(
    await apiClient.post<SaveWorkoutLogResponse | ApiEnvelope<SaveWorkoutLogResponse>>(endpoints.saveWorkoutLog, {
      user_id: "user_local_001",
      session_id: records[0]?.session_id ?? "session_local_001",
      records
    })
  );
}

export async function getWorkoutRecords(sessionId?: string): Promise<SetRecord[]> {
  const params = new URLSearchParams();
  if (sessionId) params.set("session_id", sessionId);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return unwrap(await apiClient.get<SetRecord[] | ApiEnvelope<SetRecord[]>>(`${endpoints.workoutRecords}${suffix}`));
}

export async function getTrainingInsights(): Promise<TrainingInsight[]> {
  return unwrap(await apiClient.get<TrainingInsight[] | ApiEnvelope<TrainingInsight[]>>(endpoints.workoutInsights));
}

export async function getAnalyticsCalendar(range = "month", month?: string): Promise<AnalyticsCalendar> {
  const params = new URLSearchParams({ range });
  if (month) params.set("month", month);
  return unwrap(await apiClient.get<AnalyticsCalendar | ApiEnvelope<AnalyticsCalendar>>(`${endpoints.analyticsCalendar}?${params.toString()}`));
}

export async function getAnalyticsOverview(range = "month"): Promise<AnalyticsOverview> {
  return unwrap(await apiClient.get<AnalyticsOverview | ApiEnvelope<AnalyticsOverview>>(`${endpoints.analyticsOverview}?range=${encodeURIComponent(range)}`));
}

export async function sendAssistantMessage(
  message: string,
  context?: Record<string, unknown>,
  inputType: "text" | "voice" = "text"
): Promise<AssistantResponse> {
  return unwrap(
    await apiClient.post<AssistantResponse | ApiEnvelope<AssistantResponse>>(endpoints.assistantMessages, {
      user_id: "user_local_001",
      session_id: context?.session_id,
      daily_workout_plan_id: context?.plan_id,
      message,
      input_type: inputType,
      context
    })
  );
}

export async function getAssistantMessages(): Promise<AssistantMessage[]> {
  return unwrap(await apiClient.get<AssistantMessage[] | ApiEnvelope<AssistantMessage[]>>(endpoints.assistantMessages));
}

export async function uploadMedia(file: Blob, purpose: MediaUploadResponse["purpose"] = "avatar"): Promise<MediaUploadResponse> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Failed to read media")));
    reader.onerror = () => reject(new Error("Failed to read media"));
    reader.readAsDataURL(file);
  });
  return unwrap(
    await apiClient.post<MediaUploadResponse | ApiEnvelope<MediaUploadResponse>>(endpoints.mediaUpload, {
      purpose,
      data_url: dataUrl,
      mime_type: file.type || "image/jpeg"
    })
  );
}

export async function analyzeBodyPhoto(file: Blob): Promise<BodyPhotoAnalysis> {
  const asset = await uploadMedia(file, "body_photo");
  return unwrap(
    await apiClient.post<BodyPhotoAnalysis | ApiEnvelope<BodyPhotoAnalysis>>(endpoints.analyzeBodyPhoto, {
      image_asset_id: asset.asset_id
    })
  );
}

export async function getLatestBodyPhotoAnalysis(): Promise<BodyPhotoAnalysis | null> {
  return unwrap(await apiClient.get<BodyPhotoAnalysis | null | ApiEnvelope<BodyPhotoAnalysis | null>>(endpoints.latestBodyPhotoAnalysis));
}

export const realApi = {
  getUserProfile,
  updateUserProfile,
  resetUserData,
  saveTrainingProfile,
  getCurrentTrainingPlan,
  getTodayWorkout,
  generateTodayWorkout,
  updateTodayExercises,
  adjustWorkoutIntensity,
  createWorkoutSession,
  getCurrentWorkoutSession,
  getWorkoutSessions,
  endCurrentWorkoutSession,
  updateCurrentExercise,
  getExercises,
  getExerciseDetail,
  scanEquipment,
  getLatestScanResult,
  submitScanFeedback,
  addExerciseToWorkout,
  replaceExerciseInWorkout,
  parseWorkoutLog,
  saveWorkoutLog,
  getWorkoutRecords,
  getTrainingInsights,
  getAnalyticsCalendar,
  getAnalyticsOverview,
  sendAssistantMessage,
  getAssistantMessages,
  uploadMedia,
  analyzeBodyPhoto,
  getLatestBodyPhotoAnalysis
};
