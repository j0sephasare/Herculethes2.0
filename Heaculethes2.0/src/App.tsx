// src/App.tsx
import { NavLink, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import ExercisesPage from "./pages/ExercisesPage";
import MealPlannerPage from "./pages/MealPlannerPage";
import ChallengesPage from "./pages/ChallengesPage";
import ProfilePage from "./pages/ProfilePage";

const tabs = [
  { to: "/home", label: "Home" },
  { to: "/exercises", label: "Exercises" },
  { to: "/meal-planner", label: "Meal Plans" },
  { to: "/challenges", label: "Challenges" },
  { to: "/profile", label: "Profile" },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      {/* page content */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/meal-planner" element={<MealPlannerPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>

      {/* bottom tab bar */}
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
