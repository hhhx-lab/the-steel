import { Navigate, createBrowserRouter } from "react-router-dom";
import { ExercisePage } from "../pages/ExercisePage";
import { HomePage } from "../pages/HomePage";
import { ProfilePage } from "../pages/ProfilePage";
import { ScanPage } from "../pages/ScanPage";
import { ScanResultPage } from "../pages/ScanResultPage";
import { WelcomePage } from "../pages/WelcomePage";
import { WorkoutLogPage } from "../pages/WorkoutLogPage";
import { WorkoutSessionPage } from "../pages/WorkoutSessionPage";
import { useUserStore } from "../stores/userStore";

function RootRedirect() {
  const hasVisited = useUserStore((state) => state.hasVisited);
  return <Navigate to={hasVisited ? "/home" : "/welcome"} replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  { path: "/welcome", element: <WelcomePage /> },
  { path: "/home", element: <HomePage /> },
  { path: "/scan", element: <ScanPage /> },
  { path: "/scan/result", element: <ScanResultPage /> },
  { path: "/exercise/:exerciseId", element: <ExercisePage /> },
  { path: "/workout/session", element: <WorkoutSessionPage /> },
  { path: "/workout/log", element: <WorkoutLogPage /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "*", element: <Navigate to="/" replace /> }
]);
