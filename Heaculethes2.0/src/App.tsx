// src/App.tsx
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ExercisesPage from "./pages/ExercisesPage";
import MealPlannerPage from "./pages/MealPlannerPage";
import ChallengesPage from "./pages/ChallengesPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./auth/AuthContext";
import WeightWorkoutPage from "./pages/WeightWorkoutPage";


const tabs = [
  { to: "/home", label: "Home" },
  { to: "/exercises", label: "Exercises" },
  { to: "/meal-planner", label: "Meal Plans" },
  { to: "/challenges", label: "Challenges" },
  { to: "/profile", label: "Profile" },
];

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <p className="text-slate-300 text-sm">Loading…</p>
      </div>
    );
  }

  if (!user) {
    // Not logged in → only show login/register
    return <LoginPage />;
  }

  // Logged in → show the main app
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/meal-planner" element={<MealPlannerPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/weight-workout" element={<WeightWorkoutPage />} />
        </Routes>
      </main>

      <nav className="border-t border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }: { isActive: boolean }) =>
                `text-xs px-3 py-1 rounded-full transition ${
                  isActive ? "text-blue-400 bg-slate-800" : "text-slate-400"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
