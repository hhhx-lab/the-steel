import { findEquipment } from "../data/mockEquipment";
import { findExercise, mockExercises } from "../data/mockExercises";
import { mockWorkoutPlan } from "../data/mockWorkoutPlan";
import type { Exercise } from "../types/exercise";
import type { AddExerciseResponse, ParsedWorkoutLog, SaveWorkoutLogResponse, ScanResult, ScanScenario } from "../types/api";
import type { SetRecord, WorkoutPlan } from "../types/workout";
import type { UserProfile } from "../types/user";

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export async function getUserProfile(): Promise<UserProfile> {
  await sleep(180);
  return {
    user_id: "user_local_001",
    nickname: "新手铁友",
    experience_level: "newbie",
    onboarding_completed: false,
    allow_body_photo_analysis: false
  };
}

export async function getTodayWorkout(): Promise<WorkoutPlan> {
  await sleep(220);
  return clone(mockWorkoutPlan);
}

export async function getExerciseDetail(exerciseId: string): Promise<Exercise> {
  await sleep(160);
  return clone(findExercise(exerciseId));
}

export async function scanEquipment(_image: Blob | string, scenario: ScanScenario = "high"): Promise<ScanResult> {
  await sleep(900);

  if (scenario === "low") {
    return {
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
  }

  const equipmentId = scenario === "medium" ? "eq_seated_row" : "eq_lat_pulldown";
  const exerciseId = scenario === "medium" ? "ex_seated_row" : "ex_lat_pulldown";
  const exercise = findExercise(exerciseId);
  const equipment = findEquipment(equipmentId);
  const confidence = scenario === "medium" ? 0.72 : 0.92;

  return {
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
}

export async function addExerciseToWorkout(exerciseId: string): Promise<AddExerciseResponse> {
  await sleep(220);
  return {
    plan_id: mockWorkoutPlan.plan_id,
    exercise_id: exerciseId,
    position: 2,
    message: "已加入今日训练"
  };
}

export async function parseWorkoutLog(text: string, exerciseId = "ex_lat_pulldown"): Promise<ParsedWorkoutLog> {
  await sleep(520);
  const hasPain = /疼|痛|不舒服|旧伤|拉伤/.test(text);
  const normalizedExercise = findExercise(exerciseId);
  const records: SetRecord[] = [
    {
      record_id: `record_${Date.now()}_1`,
      session_id: "session_local_001",
      exercise_id: normalizedExercise.exercise_id,
      set_index: 1,
      weight: 20,
      weight_unit: "kg",
      reps: 10
    },
    {
      record_id: `record_${Date.now()}_2`,
      session_id: "session_local_001",
      exercise_id: normalizedExercise.exercise_id,
      set_index: 2,
      weight: 20,
      weight_unit: "kg",
      reps: 10
    },
    {
      record_id: `record_${Date.now()}_3`,
      session_id: "session_local_001",
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
  return {
    success: true,
    saved: records.length,
    message: "收到，我帮你记好了。这次最后一组有点吃力，下次先保持这个重量，把动作做稳。"
  };
}

export const mockApi = {
  getUserProfile,
  getTodayWorkout,
  getExerciseDetail,
  scanEquipment,
  addExerciseToWorkout,
  parseWorkoutLog,
  saveWorkoutLog,
  allExercises: mockExercises
};
