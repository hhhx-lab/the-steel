import { Navigate, createBrowserRouter } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ExercisePage } from "../pages/ExercisePage";
import { HistoryPage } from "../pages/HistoryPage";
import { HomePage } from "../pages/HomePage";
import { ProfilePage } from "../pages/ProfilePage";
import { ScanPage } from "../pages/ScanPage";
import { ScanResultPage } from "../pages/ScanResultPage";
import { TodayPlanPage } from "../pages/TodayPlanPage";
import { TodaySetupPage } from "../pages/TodaySetupPage";
import { WelcomePage } from "../pages/WelcomePage";
import { WorkoutCompletePage } from "../pages/WorkoutCompletePage";
import { WorkoutLogPage } from "../pages/WorkoutLogPage";
import { WorkoutSessionPage } from "../pages/WorkoutSessionPage";
import { getUserProfile } from "../services/tieziApi";
import { useUserStore } from "../stores/userStore";

function RootRedirect() {
  const hasVisited = useUserStore((state) => state.hasVisited);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const setHasVisited = useUserStore((state) => state.setHasVisited);
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["root-profile"],
    queryFn: getUserProfile,
    staleTime: 30_000
  });

  useEffect(() => {
    if (!profile) return;
    updateProfile(profile);
    setHasVisited(profile.onboarding_completed);
  }, [profile, setHasVisited, updateProfile]);

  if (isLoading && !profile) {
    return <div className="route-loading">小铁正在准备训练计划...</div>;
  }

  if (isError) {
    return <Navigate to={hasVisited ? "/home" : "/welcome"} replace />;
  }

  if (profile?.onboarding_completed) {
    return <Navigate to="/home" replace />;
  }

  if (profile?.training_profile_completed) {
    return <Navigate to="/onboarding/today" replace />;
  }

  return <Navigate to="/welcome" replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  { path: "/welcome", element: <WelcomePage /> },
  { path: "/onboarding/today", element: <TodaySetupPage /> },
  { path: "/onboarding/today-plan", element: <TodayPlanPage /> },
  { path: "/home", element: <HomePage /> },
  { path: "/scan", element: <ScanPage /> },
  { path: "/scan/result", element: <ScanResultPage /> },
  { path: "/exercise/:exerciseId", element: <ExercisePage /> },
  { path: "/workout/session", element: <WorkoutSessionPage /> },
  { path: "/workout/record", element: <WorkoutLogPage /> },
  { path: "/workout/complete", element: <WorkoutCompletePage /> },
  { path: "/workout/log", element: <HistoryPage /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "*", element: <Navigate to="/" replace /> }
]);
