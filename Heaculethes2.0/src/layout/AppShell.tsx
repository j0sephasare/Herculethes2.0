// src/layout/AppShell.tsx
import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/home", label: "Home", icon: "🏠" },
  { to: "/exercises", label: "Exercises", icon: "🏋️‍♂️" },
  { to: "/meal-planner", label: "Meal Plans", icon: "🍽️" },
  { to: "/challenges", label: "Challenges", icon: "🔥" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      {/* Main content swaps here, nav stays mounted */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Persistent bottom nav */}
      <nav className="border-t border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `text-xs px-3 py-1 rounded-full transition flex items-center gap-1 ${
                  isActive ? "text-blue-400 bg-slate-800" : "text-slate-400"
                }`
              }
            >
              <span aria-hidden>{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
