import { findEquipment } from "../data/mockEquipment";
import { findExercise, mockExercises } from "../data/mockExercises";
import { mockWorkoutPlan } from "../data/mockWorkoutPlan";
import type { Exercise } from "../types/exercise";
import type { AddExerciseResponse, AssistantMessage, BodyPhotoAnalysis, MediaUploadResponse, ParsedWorkoutLog, ReplaceExerciseResponse, ResetUserResponse, SaveWorkoutLogResponse, ScanFeedbackResponse, ScanResult, ScanScenario, TrainingInsight } from "../types/api";
import type { SetRecord, WorkoutPlan, WorkoutSession, WorkoutSessionSummary } from "../types/workout";
import type { FitnessGoal, SplitPreference, TrainingPlan, UserProfile } from "../types/user";

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let profileState: UserProfile = {
  user_id: "user_local_001",
  nickname: "新手铁友",
  avatar_url: "/assets/cutouts/xiaotie-female-head-cutout.png",
  experience_level: "newbie",
  fitness_goal: "fat_loss",
  split_preference: "three",
  weekly_frequency: 3,
  focus_body_parts: ["背部"],
  today_focus_part: "全身",
  training_profile_completed: false,
  onboarding_completed: false,
  allow_body_photo_analysis: false,
  home_guide_seen: false
};

let trainingPlanState: TrainingPlan = {
  training_plan_id: "tp_mock_001",
  summary: "减脂优先 · 三分化 · 每周 3 次 · 重点背部",
  fitness_goal: "fat_loss",
  split_preference: "three",
  weekly_frequency: 3,
  focus_body_parts: ["背部"],
  weekly_structure: ["拉力和背部基础", "腿臀和核心稳定", "推胸和全身巩固"],
  today_generation_hint: "优先从背部入门动作开始，训练日之间交替安排推、拉、腿。",
  updated_at: new Date().toISOString()
};
let todayPlanState: WorkoutPlan = clone(mockWorkoutPlan);
let currentSessionState: WorkoutSession | null = null;
let workoutSessionsState: WorkoutSession[] = [];
let savedRecordsState: SetRecord[] = [];
let trainingInsightsState: TrainingInsight[] = [];
let latestScanResultState: ScanResult | null = null;
let assistantMessagesState: AssistantMessage[] = [];
let mediaAssetsState: MediaUploadResponse[] = [];
let bodyPhotoAnalysesState: BodyPhotoAnalysis[] = [];

const setRecordKey = (record: SetRecord) => `${record.session_id}:${record.exercise_id}:${record.set_index}`;

const upsertSetRecords = (existingRecords: SetRecord[], incomingRecords: SetRecord[]) => {
  const records = [...existingRecords];
  incomingRecords.forEach((incoming) => {
    const existingIndex = records.findIndex((record) => setRecordKey(record) === setRecordKey(incoming));
    if (existingIndex >= 0) {
      const previous = records[existingIndex];
      records[existingIndex] = {
        ...previous,
        ...incoming,
        record_id: incoming.record_id || previous.record_id
      };
      return;
    }
    records.push(incoming);
  });
  return records;
};

export async function getUserProfile(): Promise<UserProfile> {
  await sleep(180);
  return clone(profileState);
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  await sleep(180);
  profileState = { ...profileState, ...profile };
  if (profileState.onboarding_completed) {
    profileState.training_profile_completed = true;
  }
  return clone(profileState);
}

export async function resetUserData(): Promise<ResetUserResponse> {
  await sleep(180);
  profileState = {
    user_id: "user_local_001",
    nickname: "新手铁友",
    avatar_url: "/assets/cutouts/xiaotie-female-head-cutout.png",
    experience_level: "newbie",
    fitness_goal: "fat_loss",
    split_preference: "three",
    weekly_frequency: 3,
    focus_body_parts: ["背部"],
    today_focus_part: "全身",
    training_profile_completed: false,
    onboarding_completed: false,
    allow_body_photo_analysis: false,
    home_guide_seen: false
  };
  trainingPlanState = {
    training_plan_id: "tp_mock_001",
    summary: "减脂优先 · 三分化 · 每周 3 次 · 重点背部",
    fitness_goal: "fat_loss",
    split_preference: "three",
    weekly_frequency: 3,
    focus_body_parts: ["背部"],
    weekly_structure: ["拉力和背部基础", "腿臀和核心稳定", "推胸和全身巩固"],
    today_generation_hint: "优先从背部入门动作开始，训练日之间交替安排推、拉、腿。",
    updated_at: new Date().toISOString()
  };
  todayPlanState = clone(mockWorkoutPlan);
  currentSessionState = null;
  workoutSessionsState = [];
  savedRecordsState = [];
  trainingInsightsState = [];
  latestScanResultState = null;
  assistantMessagesState = [];
  mediaAssetsState = [];
  bodyPhotoAnalysesState = [];
  return { reset: true, profile: { user_id: profileState.user_id, nickname: profileState.nickname } };
}

export async function saveTrainingProfile(payload: {
  fitness_goal: FitnessGoal;
  split_preference: SplitPreference;
  weekly_frequency: number;
  focus_body_parts: string[];
  experience_level?: UserProfile["experience_level"];
}) {
  await sleep(220);
  profileState = {
    ...profileState,
    ...payload,
    training_profile_completed: true,
    onboarding_completed: false
  };
  const splitLabel = payload.split_preference === "two" ? "二分化" : payload.split_preference === "four" ? "四分化" : "三分化";
  const goalLabel = payload.fitness_goal === "muscle_gain" ? "增肌优先" : payload.fitness_goal === "shape" ? "塑形体态" : "减脂优先";
  trainingPlanState = {
    training_plan_id: "tp_mock_001",
    summary: `${goalLabel} · ${splitLabel} · 每周 ${payload.weekly_frequency} 次 · 重点 ${payload.focus_body_parts.join("/")}`,
    fitness_goal: payload.fitness_goal,
    split_preference: payload.split_preference,
    weekly_frequency: payload.weekly_frequency,
    focus_body_parts: payload.focus_body_parts,
    weekly_structure: payload.focus_body_parts.map((part, index) => `第 ${index + 1} 个重点：${part}基础动作`),
    today_generation_hint: `今日计划会优先参考 ${payload.focus_body_parts[0] ?? "全身"}，再结合当天选择的部位微调。`,
    updated_at: new Date().toISOString()
  };
  return {
    profile_saved: true,
    ...clone(trainingPlanState)
  };
}

export async function getCurrentTrainingPlan(): Promise<TrainingPlan> {
  await sleep(120);
  return clone(trainingPlanState);
}

export async function getTodayWorkout(): Promise<WorkoutPlan> {
  await sleep(220);
  return clone(todayPlanState);
}

const mockTodayExerciseMap: Record<string, string[]> = {
  背部: ["ex_treadmill_warmup", "ex_lat_pulldown", "ex_seated_row", "ex_plank"],
  胸部: ["ex_treadmill_warmup", "ex_chest_press", "ex_plank"],
  腿臀: ["ex_treadmill_warmup", "ex_leg_press", "ex_plank"],
  肩臂: ["ex_treadmill_warmup", "ex_chest_press", "ex_seated_row", "ex_plank"],
  核心: ["ex_treadmill_warmup", "ex_plank", "ex_seated_row"],
  全身: mockWorkoutPlan.exercises.map((item) => item.exercise_id)
};

const normalizeTodayParts = (payload: { today_focus_part?: string; today_focus_parts?: string[] }) => {
  if (Array.isArray(payload.today_focus_parts) && payload.today_focus_parts.length) return payload.today_focus_parts;
  if (payload.today_focus_part) return payload.today_focus_part.split(/[、/,，\s]+/).filter(Boolean);
  return ["全身"];
};

export async function generateTodayWorkout(payload: { today_focus_part: string; today_focus_parts?: string[]; duration_minutes: number; intensity: WorkoutPlan["intensity"] }): Promise<WorkoutPlan> {
  await sleep(300);
  const todayFocusParts = normalizeTodayParts(payload);
  const selectedParts = todayFocusParts.includes("全身") ? ["全身"] : todayFocusParts;
  const exerciseIds = Array.from(new Set(selectedParts.flatMap((part) => mockTodayExerciseMap[part] ?? [])));
  const todayFocusPart = todayFocusParts.length ? todayFocusParts.join("、") : payload.today_focus_part;

  todayPlanState = {
    ...todayPlanState,
    plan_id: todayPlanState.plan_id,
    duration_minutes: payload.duration_minutes,
    title: "今日计划",
    subtitle: `${todayFocusPart}入门训练`,
    intensity: payload.intensity,
    today_focus_part: todayFocusPart,
    today_focus_parts: todayFocusParts,
    status: "draft",
    exercises: (exerciseIds.length ? exerciseIds : mockWorkoutPlan.exercises.map((item) => item.exercise_id)).map((exerciseId, index) => {
      const exercise = findExercise(exerciseId);
      return {
        exercise_id: exercise.exercise_id,
        sets: exercise.default_sets,
        reps: exercise.default_reps,
        weight_strategy: "trial_based",
        status: index === 0 ? "current" : "pending"
      };
    })
  };
  profileState = { ...profileState, today_focus_part: todayFocusPart };
  return clone(todayPlanState);
}

export async function updateTodayExercises(_planId: string, exerciseIds: string[]): Promise<WorkoutPlan> {
  await sleep(220);
  todayPlanState = {
    ...todayPlanState,
    status: "confirmed",
    exercises: exerciseIds.map((exerciseId, index) => {
      const exercise = findExercise(exerciseId);
      return {
        exercise_id: exercise.exercise_id,
        sets: exercise.default_sets,
        reps: exercise.default_reps,
        weight_strategy: "trial_based",
        status: index === 0 ? "current" : "pending"
      };
    })
  };
  return clone(todayPlanState);
}

export async function adjustWorkoutIntensity(_planId: string, intensity: WorkoutPlan["intensity"], _sessionId?: string): Promise<SaveWorkoutLogResponse> {
  await sleep(180);
  todayPlanState = {
    ...todayPlanState,
    intensity
  };
  if (currentSessionState) {
    currentSessionState = {
      ...currentSessionState,
      last_feedback: intensity === "low" ? "已经把今天强度降下来，先把动作做稳。" : "已经调整今天训练强度。"
    };
    workoutSessionsState = workoutSessionsState.map((session) => session.session_id === currentSessionState?.session_id ? currentSessionState : session);
  }
  return {
    success: true,
    saved: 0,
    message: "今日训练强度已调整。",
    plan: clone(todayPlanState),
    session: currentSessionState ? clone(currentSessionState) : null
  };
}

export async function createWorkoutSession(planId: string, initialExerciseId?: string): Promise<WorkoutSession> {
  await sleep(180);
  const firstExerciseId = initialExerciseId && todayPlanState.exercises.some((item) => item.exercise_id === initialExerciseId)
    ? initialExerciseId
    : todayPlanState.exercises[0]?.exercise_id;
  currentSessionState = {
    session_id: `session_mock_${Date.now()}`,
    user_id: profileState.user_id,
    daily_workout_plan_id: planId,
    status: "in_progress",
    current_exercise_id: firstExerciseId,
    started_at: new Date().toISOString(),
    ended_at: null,
    last_feedback: null
  };
  workoutSessionsState = [
    currentSessionState,
    ...workoutSessionsState.filter((session) => session.session_id !== currentSessionState?.session_id)
  ];
  todayPlanState = {
    ...todayPlanState,
    status: "in_progress",
    exercises: todayPlanState.exercises.map((item, index) => ({
      ...item,
      status: item.exercise_id === firstExerciseId || (!firstExerciseId && index === 0) ? "current" : "pending"
    }))
  };
  return clone(currentSessionState);
}

export async function getCurrentWorkoutSession(): Promise<WorkoutSession | null> {
  await sleep(120);
  return currentSessionState ? clone(currentSessionState) : null;
}

const summarizeSession = (session: WorkoutSession): WorkoutSessionSummary => {
  const records = savedRecordsState.filter((record) => record.session_id === session.session_id);
  const exerciseIds = Array.from(new Set(records.map((record) => record.exercise_id)));
  const bodyParts = Array.from(new Set(exerciseIds.flatMap((exerciseId) => findExercise(exerciseId).target_body_parts_beginner)));
  const recordedDuration = records.reduce((sum, record) => sum + (record.duration_minutes ?? 0), 0);
  return {
    ...session,
    set_count: records.length,
    total_volume: records.reduce((sum, record) => sum + (record.weight || 0) * (record.reps || 0), 0),
    duration_minutes: recordedDuration || todayPlanState.duration_minutes,
    exercise_ids: exerciseIds,
    body_parts: bodyParts
  };
};

export async function getWorkoutSessions(): Promise<WorkoutSessionSummary[]> {
  await sleep(140);
  return clone(workoutSessionsState.map(summarizeSession));
}

export async function endCurrentWorkoutSession(): Promise<WorkoutSession | null> {
  await sleep(120);
  if (!currentSessionState) return null;
  currentSessionState = {
    ...currentSessionState,
    status: "abandoned",
    ended_at: new Date().toISOString(),
    last_feedback: "已结束本次训练，已经记录的内容会保留在记录页里。"
  };
  workoutSessionsState = workoutSessionsState.map((session) => session.session_id === currentSessionState?.session_id ? currentSessionState : session);
  todayPlanState = {
    ...todayPlanState,
    status: "abandoned"
  };
  return clone(currentSessionState);
}

export async function updateCurrentExercise(exerciseId: string, _sessionId?: string): Promise<WorkoutSession | null> {
  await sleep(120);
  if (!currentSessionState) return null;
  currentSessionState = {
    ...currentSessionState,
    current_exercise_id: exerciseId
  };
  todayPlanState = {
    ...todayPlanState,
    exercises: todayPlanState.exercises.map((item) => {
      if (item.status === "completed") return item;
      return { ...item, status: item.exercise_id === exerciseId ? "current" : "pending" };
    })
  };
  return clone(currentSessionState);
}

export async function getExercises(): Promise<Exercise[]> {
  await sleep(140);
  return clone(mockExercises);
}

export async function getExerciseDetail(exerciseId: string): Promise<Exercise> {
  await sleep(160);
  return clone(findExercise(exerciseId));
}

export async function scanEquipment(_image: Blob | string, scenario: ScanScenario = "high", _todayPlanId?: string): Promise<ScanResult> {
  await sleep(900);
  const scanId = `scan_mock_${Date.now()}`;
  const asset: MediaUploadResponse = {
    asset_id: `asset_scan_mock_${Date.now()}`,
    url: typeof _image === "string" ? _image : URL.createObjectURL(_image),
    mime_type: typeof _image === "string" ? "text/uri-list" : (_image.type || "image/jpeg"),
    purpose: "scan"
  };
  mediaAssetsState = [asset, ...mediaAssetsState];

  if (scenario === "low") {
    const result: ScanResult = {
      scan_id: scanId,
      image_asset_id: asset.asset_id,
      image_url: asset.url,
      created_at: new Date().toISOString(),
      recognized: false,
      confidence: 0.48,
      equipment: findEquipment("eq_unknown"),
      target_body_parts_beginner: [],
      target_muscles: [],
      beginner_friendly: false,
      risk_level: "medium",
      recommended_exercises: [],
      today_recommendation: {
        recommended: false,
        reason: "我还不太确定这是哪台器械，需要再拍一张正面、说明牌或把手位置。",
        suggested_sets: 0,
        suggested_reps: "0"
      },
      user_facing_summary: "我还不太确定这是哪台器械。你可以再拍一张器械正面、说明牌或把手位置，我会再帮你看。",
      need_more_photo: true
    };
    latestScanResultState = clone(result);
    return result;
  }

  const equipmentId = scenario === "medium" ? "eq_seated_row" : "eq_lat_pulldown";
  const exerciseId = scenario === "medium" ? "ex_seated_row" : "ex_lat_pulldown";
  const exercise = findExercise(exerciseId);
  const equipment = findEquipment(equipmentId);
  const confidence = scenario === "medium" ? 0.72 : 0.92;

  const result: ScanResult = {
    scan_id: scanId,
    image_asset_id: asset.asset_id,
    image_url: asset.url,
    created_at: new Date().toISOString(),
    recognized: true,
    confidence,
    equipment,
    target_body_parts_beginner: equipment.target_body_parts_beginner,
    target_muscles: equipment.target_muscles,
    beginner_friendly: equipment.beginner_friendly,
    risk_level: equipment.risk_level,
    recommended_exercises: [
      {
        exercise_id: exercise.exercise_id,
        name_cn: exercise.name_cn,
        difficulty: exercise.difficulty
      }
    ],
    today_recommendation: {
      recommended: true,
      reason:
        scenario === "medium"
          ? "可能适合作为今天的背部动作。你可以先确认器械是不是坐姿划船，再加入训练。"
          : "适合作为今天全身入门训练的背部动作，建议热身后做。",
      suggested_sets: exercise.default_sets,
      suggested_reps: exercise.default_reps
    },
    user_facing_summary:
      scenario === "medium"
        ? "这可能是坐姿划船器，主要练背中间。小铁还想让你确认一下器械正面。"
        : "这是一台练背为主的下拉器械，新手可以用它学习背部发力。",
    need_more_photo: false
  };
  latestScanResultState = clone(result);
  return result;
}

export async function getLatestScanResult(): Promise<ScanResult | null> {
  await sleep(120);
  return latestScanResultState ? clone(latestScanResultState) : null;
}

export async function submitScanFeedback(_payload: { feedback: string; actual_equipment_name?: string; scan_result?: ScanResult }): Promise<ScanFeedbackResponse> {
  await sleep(180);
  return {
    feedback_id: `feedback_mock_${Date.now()}`,
    message: "收到，我会把这条反馈用于修正这次识别记录。"
  };
}

export async function addExerciseToWorkout(exerciseId: string, _planId?: string): Promise<AddExerciseResponse> {
  await sleep(220);
  if (!todayPlanState.exercises.some((item) => item.exercise_id === exerciseId)) {
    const exercise = findExercise(exerciseId);
    todayPlanState.exercises.push({
      exercise_id: exercise.exercise_id,
      sets: exercise.default_sets,
      reps: exercise.default_reps,
      weight_strategy: "trial_based",
      status: "pending"
    });
  }
  return {
    plan_id: todayPlanState.plan_id,
    exercise_id: exerciseId,
    position: todayPlanState.exercises.findIndex((item) => item.exercise_id === exerciseId) + 1,
    message: "已加入今日训练",
    plan: clone(todayPlanState)
  };
}

export async function replaceExerciseInWorkout(fromExerciseId: string, toExerciseId: string, _planId?: string): Promise<ReplaceExerciseResponse> {
  await sleep(220);
  const replacement = findExercise(toExerciseId);
  const fromIndex = todayPlanState.exercises.findIndex((item) => item.exercise_id === fromExerciseId);
  const fromExercise = todayPlanState.exercises[fromIndex];
  const filtered = todayPlanState.exercises.filter((item) => item.exercise_id !== fromExerciseId && item.exercise_id !== toExerciseId);
  const replacementPlanItem = {
    exercise_id: replacement.exercise_id,
    sets: replacement.default_sets,
    reps: replacement.default_reps,
    weight_strategy: "trial_based" as const,
    status: fromExercise?.status ?? "pending"
  };
  const insertIndex = fromIndex >= 0 ? Math.min(fromIndex, filtered.length) : filtered.length;
  todayPlanState = {
    ...todayPlanState,
    exercises: [
      ...filtered.slice(0, insertIndex),
      replacementPlanItem,
      ...filtered.slice(insertIndex)
    ]
  };
  if (currentSessionState?.current_exercise_id === fromExerciseId || replacementPlanItem.status === "current") {
    currentSessionState = currentSessionState ? { ...currentSessionState, current_exercise_id: toExerciseId } : currentSessionState;
  }
  return {
    plan_id: todayPlanState.plan_id,
    from_exercise_id: fromExerciseId,
    to_exercise_id: toExerciseId,
    message: `已替换为${replacement.name_cn}`,
    plan: clone(todayPlanState),
    session: currentSessionState ? clone(currentSessionState) : null
  };
}

export async function parseWorkoutLog(text: string, exerciseId = "ex_lat_pulldown", sessionId = "session_local_001"): Promise<ParsedWorkoutLog> {
  await sleep(520);
  const hasPain = /疼|痛|不舒服|旧伤|拉伤/.test(text);
  const normalizedExercise = findExercise(exerciseId);
  const isCardio = /跑步|热身|有氧|分钟|秒/.test(`${normalizedExercise.name_cn}${normalizedExercise.default_reps}`);
  if (isCardio) {
    const duration = Number(text.match(/(\d+(?:\.\d+)?)\s*(?:分钟|min)/i)?.[1]) || Number.parseInt(normalizedExercise.default_reps, 10) || 5;
    const distance = Number(text.match(/(\d+(?:\.\d+)?)\s*(?:公里|千米|km)/i)?.[1]) || 0.5;
    return {
      exercise_name: normalizedExercise.name_cn,
      exercise_id: normalizedExercise.exercise_id,
      sets: [
        {
          record_id: `record_${Date.now()}_1`,
          session_id: sessionId,
          exercise_id: normalizedExercise.exercise_id,
          set_index: 1,
          weight: 0,
          weight_unit: "kg",
          reps: 0,
          duration_minutes: duration,
          distance_km: distance,
          user_note: text
        }
      ],
      need_confirmation: true,
      xiaotie_feedback: `收到，我先帮你整理成 ${duration} 分钟、${distance} km 的有氧记录。`,
      safety_warning: hasPain ? "如果有疼痛、不适或旧伤，先停止训练，并咨询专业教练或医生。" : undefined
    };
  }
  const records: SetRecord[] = [
    {
      record_id: `record_${Date.now()}_1`,
      session_id: sessionId,
      exercise_id: normalizedExercise.exercise_id,
      set_index: 1,
      weight: 20,
      weight_unit: "kg",
      reps: 10
    },
    {
      record_id: `record_${Date.now()}_2`,
      session_id: sessionId,
      exercise_id: normalizedExercise.exercise_id,
      set_index: 2,
      weight: 20,
      weight_unit: "kg",
      reps: 10
    },
    {
      record_id: `record_${Date.now()}_3`,
      session_id: sessionId,
      exercise_id: normalizedExercise.exercise_id,
      set_index: 3,
      weight: 20,
      weight_unit: "kg",
      reps: 8,
      rpe_text: text.includes("累") ? "有点累" : undefined,
      user_note: text.includes("累") ? "最后一组有点累" : undefined
    }
  ];

  return {
    exercise_name: normalizedExercise.name_cn,
    exercise_id: normalizedExercise.exercise_id,
    sets: records,
    need_confirmation: true,
    xiaotie_feedback: hasPain
      ? "如果这个动作让你感到疼痛，先停止训练。小铁只能提供入门建议，不能替代专业教练或医生判断。"
      : "收到，我先帮你整理成 3 组记录。确认没问题后就能保存。",
    safety_warning: hasPain
      ? "如果有疼痛、不适或旧伤，先停止训练，并咨询专业教练或医生。"
      : undefined
  };
}

export async function saveWorkoutLog(records: SetRecord[]): Promise<SaveWorkoutLogResponse> {
  await sleep(220);
  savedRecordsState = upsertSetRecords(savedRecordsState, records);
  const insights = records.flatMap((record) => {
    const text = `${record.rpe_text ?? ""} ${record.user_note ?? ""}`;
    const flags = [
      /太重|做不动/.test(text) ? "heavy" : "",
      /累|吃力/.test(text) ? "tired" : "",
      /轻松|刚好|稳定/.test(text) ? "easy" : "",
      /疼|痛|不舒服/.test(text) ? "pain" : ""
    ].filter(Boolean);
    return flags.length ? [{
      insight_id: `insight_mock_${Date.now()}_${record.set_index}`,
      session_id: record.session_id,
      exercise_id: record.exercise_id,
      set_index: record.set_index,
      flags,
      note: record.user_note ?? record.rpe_text ?? "",
      created_at: new Date().toISOString()
    }] : [];
  });
  trainingInsightsState = [...insights, ...trainingInsightsState].slice(0, 60);
  if (currentSessionState && !workoutSessionsState.some((session) => session.session_id === currentSessionState?.session_id)) {
    workoutSessionsState.unshift(currentSessionState);
  }
  return {
    success: true,
    saved: records.length,
    message: "收到，我帮你记好了。这次最后一组有点吃力，下次先保持这个重量，把动作做稳。"
  };
}

export async function getWorkoutRecords(sessionId?: string): Promise<SetRecord[]> {
  await sleep(120);
  const records = sessionId ? savedRecordsState.filter((record) => record.session_id === sessionId) : savedRecordsState;
  return clone(records);
}

export async function getTrainingInsights(): Promise<TrainingInsight[]> {
  await sleep(120);
  return clone(trainingInsightsState.slice(0, 20));
}

export async function getAnalyticsCalendar(range = "month", month?: string) {
  await sleep(180);
  const totalVolume = savedRecordsState.reduce((sum, record) => sum + (record.weight || 0) * (record.reps || 0), 0);
  const date = month ? `${month}-09` : new Date().toISOString().slice(0, 10);
  return {
    range,
    date,
    entries: [
      {
        date,
        session_count: currentSessionState ? 1 : 0,
        set_count: savedRecordsState.length,
        total_volume: totalVolume,
        body_parts: ["背部", "腿臀"],
        type: "strength"
      }
    ]
  };
}

export async function getAnalyticsOverview(range = "month") {
  await sleep(180);
  const totalVolume = savedRecordsState.reduce((sum, record) => sum + (record.weight || 0) * (record.reps || 0), 0);
  const bodyPartCount = savedRecordsState.length;
  return {
    range,
    session_days: currentSessionState ? 1 : 0,
    set_count: savedRecordsState.length,
    total_volume: totalVolume,
    duration_minutes: todayPlanState.duration_minutes,
    body_parts: bodyPartCount ? [
      { body_part: "背两侧", focus_score: 1, set_count: bodyPartCount }
    ] : [],
    longest_streak_days: bodyPartCount ? 1 : 0,
    monthly_bars: [
      { label: "11月", session_days: 0, duration_minutes: 0 },
      { label: "12月", session_days: 0, duration_minutes: 0 },
      { label: "1月", session_days: 0, duration_minutes: 0 },
      { label: "2月", session_days: 0, duration_minutes: 0 },
      { label: "3月", session_days: currentSessionState ? 1 : 0, duration_minutes: todayPlanState.duration_minutes }
    ]
  };
}

export async function sendAssistantMessage(message: string, context?: Record<string, unknown>, inputType: "text" | "voice" = "text") {
  await sleep(360);
  const needsAlternative = /占|替代|换|没有/.test(message);
  const needsIntensityDown = /太重|太累|强度.*高|降.*强度|轻一点|轻点/.test(message);
  const currentExerciseId = typeof context?.current_exercise_id === "string" ? context.current_exercise_id : "ex_lat_pulldown";
  const fallbackExerciseId = currentExerciseId === "ex_seated_row" ? "ex_lat_pulldown" : "ex_seated_row";
  const suggested_actions = [
    ...(needsAlternative ? [{ type: "replace_exercise", from_exercise_id: currentExerciseId, to_exercise_id: fallbackExerciseId, label: fallbackExerciseId === "ex_seated_row" ? "替换为坐姿划船" : "替换为高位下拉" }] : []),
    ...(needsIntensityDown ? [{ type: "adjust_intensity", intensity: "low" as const, label: "降低今日强度" }] : [])
  ];
  const reply = needsAlternative
    ? "可以换成坐姿划船，训练部位接近，也更容易保持稳定发力。我会把强度先放在适中，不追重量。"
    : needsIntensityDown
      ? "收到，今天先把强度降下来。你可以降低重量、少做一组，优先保证动作稳定。"
    : "收到，我会结合今天计划和你的体感帮你调整。";
  const message_id = `msg_mock_${Date.now()}`;
  const now = new Date().toISOString();
  const userMessage: AssistantMessage = {
    id: `user_${Date.now()}`,
    role: "user",
    message,
    input_type: inputType,
    session_id: typeof context?.session_id === "string" ? context.session_id : currentSessionState?.session_id ?? null,
    daily_workout_plan_id: typeof context?.plan_id === "string" ? context.plan_id : todayPlanState.plan_id,
    context,
    created_at: now
  };
  const assistantMessage: AssistantMessage = {
    id: message_id,
    role: "assistant",
    message: reply,
    input_type: inputType,
    session_id: userMessage.session_id,
    daily_workout_plan_id: userMessage.daily_workout_plan_id,
    context,
    created_at: now,
    suggested_actions
  };
  assistantMessagesState = [
    ...assistantMessagesState,
    userMessage,
    assistantMessage
  ].slice(-20);
  return {
    message_id,
    reply,
    suggested_actions
  };
}

export async function getAssistantMessages(): Promise<AssistantMessage[]> {
  await sleep(120);
  return clone(assistantMessagesState);
}

export async function uploadMedia(file: Blob, purpose: MediaUploadResponse["purpose"] = "avatar"): Promise<MediaUploadResponse> {
  await sleep(220);
  const asset = {
    asset_id: `asset_mock_${Date.now()}`,
    url: URL.createObjectURL(file),
    mime_type: file.type || "image/jpeg",
    purpose
  };
  mediaAssetsState = [asset, ...mediaAssetsState];
  return asset;
}

export async function analyzeBodyPhoto(file: Blob): Promise<BodyPhotoAnalysis> {
  await sleep(520);
  if (!profileState.allow_body_photo_analysis) {
    throw new Error("请先开启体态照片分析。");
  }
  const asset = await uploadMedia(file, "body_photo");
  const analysis: BodyPhotoAnalysis = {
    analysis_id: `body_mock_${Date.now()}`,
    user_id: profileState.user_id,
    image_asset_id: asset.asset_id,
    image_url: asset.url,
    posture_summary: "从这张照片看，训练重点可以先放在背部激活、胸肩打开和核心稳定上。",
    focus_areas: [
      { body_part: "背部", finding: "建议优先建立肩胛后缩和下沉的感觉。", priority: "medium" },
      { body_part: "核心", finding: "核心稳定会帮助推、拉、腿部动作更稳。", priority: "medium" },
      { body_part: "胸肩", finding: "训练前加入轻量热身，减少耸肩代偿。", priority: "low" }
    ],
    recommended_body_parts: ["背部", "核心", "胸肩"],
    recommended_exercises: [
      { exercise_id: "ex_lat_pulldown", name_cn: "高位下拉", difficulty: "beginner" },
      { exercise_id: "ex_seated_row", name_cn: "坐姿划船", difficulty: "beginner" },
      { exercise_id: "ex_plank", name_cn: "平板支撑", difficulty: "beginner" }
    ],
    xiaotie_tip: "今天先用轻重量找发力，动作稳了再加重量。",
    privacy_note: "照片只用于本次体态训练建议展示，你可以随时清除体验数据。",
    created_at: new Date().toISOString()
  };
  bodyPhotoAnalysesState = [analysis, ...bodyPhotoAnalysesState].slice(0, 10);
  return clone(analysis);
}

export async function getLatestBodyPhotoAnalysis(): Promise<BodyPhotoAnalysis | null> {
  await sleep(140);
  return bodyPhotoAnalysesState[0] ? clone(bodyPhotoAnalysesState[0]) : null;
}

export const mockApi = {
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
  getLatestBodyPhotoAnalysis,
  allExercises: mockExercises
};
