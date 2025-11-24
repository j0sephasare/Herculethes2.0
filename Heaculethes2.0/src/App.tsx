// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ExercisesPage from "./pages/ExercisesPage";
import MealPlannerPage from "./pages/MealPlannerPage";
import ChallengesPage from "./pages/ChallengesPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./auth/AuthContext";
import WeightWorkoutPage from "./pages/WeightWorkoutPage";
import SaveWorkoutPage from "./pages/SaveWorkoutPage";
import WorkoutDetailPage from "./pages/WorkoutDetailPage";
import MacroCalculatorPage from "./pages/MacroCalculatorPage";
import GymsNearMePage from "./pages/GymsNearMePage";
import GoForRunPage from "./pages/GoForRunPage";
import AppShell from "./layout/AppShell";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500 to-amber-300 animate-pulse flex items-center justify-center shadow-[0_0_0_3px_rgba(234,179,8,0.2)]">
            <span className="text-slate-900 font-bold">Λ</span>
          </div>
          <p className="text-sm text-yellow-200/80">Summoning the gods…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="exercises" element={<ExercisesPage />} />
        <Route path="meal-planner" element={<MealPlannerPage />} />
        <Route path="challenges" element={<ChallengesPage />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* Workout flow */}
        <Route path="weight-workout" element={<WeightWorkoutPage />} />
        <Route path="save-workout" element={<SaveWorkoutPage />} />
        <Route path="workouts/:id" element={<WorkoutDetailPage />} />

        {/* Extras */}
        <Route path="macros" element={<MacroCalculatorPage />} />
        <Route path="gyms" element={<GymsNearMePage />} />
        <Route path="go-run" element={<GoForRunPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
