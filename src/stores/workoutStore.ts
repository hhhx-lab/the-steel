import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findExercise } from "../data/mockExercises";
import { mockWorkoutPlan } from "../data/mockWorkoutPlan";
import type { SetRecord, WorkoutPlan, WorkoutSessionStatus } from "../types/workout";

type WorkoutState = {
  session_id: string;
  plan: WorkoutPlan;
  status: WorkoutSessionStatus;
  currentExerciseId: string;
  records: SetRecord[];
  lastFeedback?: string;
  startSession: () => void;
  addExercise: (exerciseId: string) => void;
  setCurrentExercise: (exerciseId: string) => void;
  completeCurrentExercise: () => void;
  saveRecords: (records: SetRecord[], feedback?: string) => void;
  resetWorkout: () => void;
};

const clonePlan = () => JSON.parse(JSON.stringify(mockWorkoutPlan)) as WorkoutPlan;
const firstExerciseId = mockWorkoutPlan.exercises[0]?.exercise_id ?? "ex_lat_pulldown";

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      session_id: "session_local_001",
      plan: clonePlan(),
      status: "not_started",
      currentExerciseId: firstExerciseId,
      records: [],
      lastFeedback: undefined,

      startSession: () =>
        set((state) => ({
          status: "in_progress",
          plan: {
            ...state.plan,
            exercises: state.plan.exercises.map((item, index) => ({
              ...item,
              status: item.status === "completed" ? "completed" : index === 0 ? "current" : item.status === "current" ? "current" : "pending"
            }))
          },
          currentExerciseId: state.currentExerciseId || state.plan.exercises[0]?.exercise_id || firstExerciseId
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

      saveRecords: (records, feedback) =>
        set((state) => ({
          records: [...state.records, ...records],
          status: "in_progress",
          lastFeedback: feedback ?? "收到，我帮你记好了。"
        })),

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
