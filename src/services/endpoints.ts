export const endpoints = {
  userProfile: "/api/user/profile",
  todayWorkout: "/api/workout/today",
  scanEquipment: "/api/equipment/scan",
  exerciseDetail: (exerciseId: string) => `/api/exercises/${exerciseId}`,
  addExercise: "/api/workout/add-exercise",
  parseWorkoutLog: "/api/workout/log/parse",
  saveWorkoutLog: "/api/workout/log"
} as const;
