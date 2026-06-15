import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findExercise } from "../data/mockExercises";
import { mockWorkoutPlan } from "../data/mockWorkoutPlan";
import type { SetRecord, WorkoutPlan, WorkoutPlanExercise, WorkoutSession, WorkoutSessionStatus } from "../types/workout";

type WorkoutState = {
  session_id: string;
  plan: WorkoutPlan;
  status: WorkoutSessionStatus;
  currentExerciseId: string;
  records: SetRecord[];
  lastFeedback?: string;
  setPlan: (plan: WorkoutPlan) => void;
  setSession: (session: WorkoutSession | null) => void;
  startSession: (initialExerciseId?: string) => void;
  addExercise: (exerciseId: string) => void;
  replaceExercise: (fromExerciseId: string, toExerciseId: string) => void;
  configurePlan: (settings: Pick<WorkoutPlan, "duration_minutes" | "intensity">) => void;
  generateTodayPlan: (settings: {
    title: string;
    subtitle: string;
    duration_minutes: number;
    intensity: WorkoutPlan["intensity"];
    exercises: WorkoutPlanExercise[];
  }) => void;
  setCurrentExercise: (exerciseId: string) => void;
  completeCurrentExercise: () => void;
  endSession: () => void;
  setRecords: (records: SetRecord[]) => void;
  appendRecords: (records: SetRecord[], feedback?: string) => void;
  saveRecords: (records: SetRecord[], feedback?: string) => void;
  resetWorkout: () => void;
};

const clonePlan = () => JSON.parse(JSON.stringify(mockWorkoutPlan)) as WorkoutPlan;
const firstExerciseId = mockWorkoutPlan.exercises[0]?.exercise_id ?? "ex_lat_pulldown";
const setRecordKey = (record: SetRecord) => `${record.session_id}:${record.exercise_id}:${record.set_index}`;

const upsertRecords = (existingRecords: SetRecord[], incomingRecords: SetRecord[]) => {
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

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      session_id: "session_local_001",
      plan: clonePlan(),
      status: "not_started",
      currentExerciseId: firstExerciseId,
      records: [],
      lastFeedback: undefined,

      setPlan: (plan) =>
        set((state) => ({
          plan,
          currentExerciseId: plan.exercises.find((item) => item.status === "current")?.exercise_id ?? plan.exercises[0]?.exercise_id ?? state.currentExerciseId
        })),

      setSession: (session) =>
        set((state) => ({
          session_id: session?.session_id ?? "session_local_001",
          status: session?.status ?? "not_started",
          currentExerciseId: session?.current_exercise_id ?? state.currentExerciseId,
          lastFeedback: session?.last_feedback ?? (session ? state.lastFeedback : undefined)
        })),

      startSession: (initialExerciseId) =>
        set((state) => ({
          status: "in_progress",
          plan: {
            ...state.plan,
            exercises: state.plan.exercises.map((item, index) => ({
              ...item,
              status: item.exercise_id === (initialExerciseId ?? state.plan.exercises[0]?.exercise_id) || (!initialExerciseId && index === 0) ? "current" : "pending"
            }))
          },
          currentExerciseId: initialExerciseId ?? state.plan.exercises[0]?.exercise_id ?? state.currentExerciseId ?? firstExerciseId
        })),

      addExercise: (exerciseId) =>
        set((state) => {
          const exists = state.plan.exercises.some((item) => item.exercise_id === exerciseId);
          if (exists) {
            return { currentExerciseId: exerciseId };
          }

          const exercise = findExercise(exerciseId);
          const currentIndex = Math.max(
            0,
            state.plan.exercises.findIndex((item) => item.exercise_id === state.currentExerciseId)
          );
          const nextExercises = [...state.plan.exercises];
          nextExercises.splice(currentIndex + 1, 0, {
            exercise_id: exercise.exercise_id,
            sets: exercise.default_sets,
            reps: exercise.default_reps,
            weight_strategy: "trial_based",
            status: "pending"
          });

          return {
            plan: { ...state.plan, exercises: nextExercises },
            status: "in_progress",
            lastFeedback: `${exercise.name_cn}已加入今日训练。`
          };
        }),

      replaceExercise: (fromExerciseId, toExerciseId) =>
        set((state) => {
          const replacement = findExercise(toExerciseId);
          const fromIndex = state.plan.exercises.findIndex((item) => item.exercise_id === fromExerciseId);
          const fromItem = state.plan.exercises[fromIndex];
          const filtered = state.plan.exercises.filter((item) => item.exercise_id !== fromExerciseId && item.exercise_id !== toExerciseId);
          const replacementItem: WorkoutPlanExercise = {
            exercise_id: replacement.exercise_id,
            sets: replacement.default_sets,
            reps: replacement.default_reps,
            weight_strategy: "trial_based",
            status: fromItem?.status ?? "pending"
          };
          const insertIndex = fromIndex >= 0 ? Math.min(fromIndex, filtered.length) : filtered.length;
          return {
            plan: {
              ...state.plan,
              exercises: [
                ...filtered.slice(0, insertIndex),
                replacementItem,
                ...filtered.slice(insertIndex)
              ]
            },
            currentExerciseId: state.currentExerciseId === fromExerciseId || replacementItem.status === "current" ? toExerciseId : state.currentExerciseId,
            lastFeedback: `${replacement.name_cn}已替换进今日训练。`
          };
        }),

      configurePlan: (settings) =>
        set((state) => ({
          plan: {
            ...state.plan,
            duration_minutes: settings.duration_minutes,
            intensity: settings.intensity
          }
        })),

      generateTodayPlan: (settings) =>
        set((state) => ({
          plan: {
            ...state.plan,
            title: settings.title,
            subtitle: settings.subtitle,
            duration_minutes: settings.duration_minutes,
            intensity: settings.intensity,
            exercises: settings.exercises
          },
          status: "not_started",
          currentExerciseId: settings.exercises[0]?.exercise_id ?? state.currentExerciseId,
          lastFeedback: "今日训练计划已生成，确认动作后就可以开始。"
        })),

      setCurrentExercise: (exerciseId) =>
        set((state) => ({
          currentExerciseId: exerciseId,
          status: "in_progress",
          plan: {
            ...state.plan,
            exercises: state.plan.exercises.map((item) => {
              if (item.status === "completed") return item;
              return { ...item, status: item.exercise_id === exerciseId ? "current" : "pending" };
            })
          }
        })),

      completeCurrentExercise: () =>
        set((state) => {
          const currentIndex = state.plan.exercises.findIndex((item) => item.exercise_id === state.currentExerciseId);
          const nextPending = state.plan.exercises.findIndex((item, index) => index > currentIndex && item.status !== "completed");
          const nextExerciseId = nextPending >= 0 ? state.plan.exercises[nextPending].exercise_id : state.currentExerciseId;
          const completed = nextPending < 0;

          return {
            status: completed ? "completed" : "in_progress",
            currentExerciseId: nextExerciseId,
            plan: {
              ...state.plan,
              exercises: state.plan.exercises.map((item, index) => {
                if (index === currentIndex) return { ...item, status: "completed" };
                if (!completed && index === nextPending) return { ...item, status: "current" };
                return item.status === "current" ? { ...item, status: "pending" } : item;
              })
            },
            lastFeedback: completed ? "今天这组训练完成啦，记得补水和拉伸。" : "不错，进入下一个动作。"
          };
        }),

      endSession: () =>
        set({
          status: "abandoned",
          lastFeedback: "已结束本次训练，已经记录的内容会保留在记录页里。"
        }),

      setRecords: (records) => set({ records }),

      appendRecords: (records, feedback) =>
        set((state) => ({
          records: upsertRecords(state.records, records),
          lastFeedback: feedback ?? state.lastFeedback
        })),

      saveRecords: (records, feedback) =>
        set((state) => {
          const currentExerciseId = records[0]?.exercise_id ?? state.currentExerciseId;
          const currentIndex = state.plan.exercises.findIndex((item) => item.exercise_id === currentExerciseId);
          const nextPending = state.plan.exercises.findIndex((item, index) => index > currentIndex && item.status !== "completed");
          const completed = currentIndex >= 0 && nextPending < 0;
          const nextExerciseId = nextPending >= 0 ? state.plan.exercises[nextPending].exercise_id : state.currentExerciseId;

          return {
            records: upsertRecords(state.records, records),
            status: completed ? "completed" : "in_progress",
            currentExerciseId: nextExerciseId,
            plan: {
              ...state.plan,
              exercises: state.plan.exercises.map((item, index) => {
                if (index === currentIndex) return { ...item, status: "completed" };
                if (!completed && index === nextPending) return { ...item, status: "current" };
                return item.status === "current" ? { ...item, status: "pending" } : item;
              })
            },
            lastFeedback: feedback ?? "这组记好了，动作也完成了。补口水，下一组继续稳住。"
          };
        }),

      resetWorkout: () =>
        set({
          session_id: "session_local_001",
          plan: clonePlan(),
          status: "not_started",
          currentExerciseId: firstExerciseId,
          records: [],
          lastFeedback: undefined
        })
    }),
    {
      name: "tiezi-workout"
    }
  )
);

export const selectCurrentPlanExercise = () => {
  const state = useWorkoutStore.getState();
  return state.plan.exercises.find((item) => item.exercise_id === state.currentExerciseId) ?? state.plan.exercises[0];
};
