// src/layout/AppShell.tsx
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { WorkoutGuardProvider, useWorkoutGuard } from "../guards/WorkoutGuard";

const tabs = [
  { to: "/home", label: "Home", icon: "🏠" },
  { to: "/exercises", label: "Exercises", icon: "🏋️‍♂️" },
  { to: "/meal-planner", label: "Meal Plans", icon: "🍽️" },
  { to: "/challenges", label: "Challenges", icon: "🔥" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

function TabLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  const { dirty } = useWorkoutGuard();
  const location = useLocation();

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (!dirty) return;
    if (to === location.pathname) return; // no-op if same route
    const ok = window.confirm("You have an in-progress workout. Leave this page?");
    if (!ok) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <NavLink
      to={to}
      onClick={handleClick}
      className={({ isActive }) =>
        `text-xs px-3 py-1 rounded-full transition flex items-center gap-1 ${
          isActive ? "text-blue-400 bg-slate-800" : "text-slate-400"
        }`
      }
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppShell() {
  return (
    <WorkoutGuardProvider>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        <nav className="border-t border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="flex justify-around py-2">
            {tabs.map((t) => (
              <TabLink key={t.to} {...t} />
            ))}
          </div>
        </nav>
      </div>
    </WorkoutGuardProvider>
  );
}
