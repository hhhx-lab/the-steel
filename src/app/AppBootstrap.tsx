import { useQuery } from "@tanstack/react-query";
import { getCurrentWorkoutSession, getLatestScanResult, getTodayWorkout, getUserProfile, getWorkoutRecords } from "../services/tieziApi";
import { useScanStore } from "../stores/scanStore";
import { useUserStore } from "../stores/userStore";
import { useWorkoutStore } from "../stores/workoutStore";

export function AppBootstrap() {
  const updateProfile = useUserStore((state) => state.updateProfile);
  const setHasVisited = useUserStore((state) => state.setHasVisited);
  const setPlan = useWorkoutStore((state) => state.setPlan);
  const setSession = useWorkoutStore((state) => state.setSession);
  const setRecords = useWorkoutStore((state) => state.setRecords);
  const setScanResult = useScanStore((state) => state.setResult);

  useQuery({
    queryKey: ["bootstrap-profile"],
    queryFn: async () => {
      const profile = await getUserProfile();
      updateProfile(profile);
      setHasVisited(profile.onboarding_completed);
      return profile;
    },
    staleTime: 30_000
  });

  useQuery({
    queryKey: ["bootstrap-workout"],
    queryFn: async () => {
      const [plan, session] = await Promise.all([getTodayWorkout(), getCurrentWorkoutSession()]);
      const records = session?.session_id ? await getWorkoutRecords(session.session_id) : [];
      setPlan(plan);
      setSession(session);
      setRecords(records);
      return { plan, session, records };
    },
    staleTime: 30_000
  });

  useQuery({
    queryKey: ["bootstrap-latest-scan"],
    queryFn: async () => {
      const result = await getLatestScanResult();
      setScanResult(result);
      return result;
    },
    staleTime: 30_000
  });

  return null;
}
