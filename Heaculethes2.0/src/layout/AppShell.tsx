// src/layout/AppShell.tsx
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { WorkoutGuardProvider, useWorkoutGuard } from "../guards/WorkoutGuard";

const tabs = [
  { to: "/home", label: "Home", icon: "🏛️" },
  { to: "/exercises", label: "Exercises", icon: "🏋️‍♂️" },
  { to: "/meal-planner", label: "Meals", icon: "🍇" },
  { to: "/challenges", label: "Challenges", icon: "⚡" },
  { to: "/profile", label: "Profile", icon: "🛡️" },
];

function TabLink({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: string;
}) {
  const { dirty } = useWorkoutGuard();
  const location = useLocation();

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (!dirty) return;
    if (to === location.pathname) return; // no-op if same route
    const ok = window.confirm(
      "You have an in-progress workout. Leave this page?"
    );
    if (!ok) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <NavLink
      to={to}
      onClick={handleClick}
      aria-label={label}
      className={({ isActive }) =>
        [
          "flex flex-col items-center justify-center rounded-xl px-3 py-2 text-[11px] transition",
          "border",
          isActive
            ? "text-yellow-100 border-yellow-400/40 bg-gradient-to-b from-yellow-500/15 to-amber-400/10 shadow-[inset_0_0_0_1px_rgba(234,179,8,0.15)]"
            : "text-slate-300 border-transparent hover:border-slate-700 hover:bg-slate-900/60",
        ].join(" ")
      }
    >
      <span className="text-base leading-none" aria-hidden>
        {icon}
      </span>
      <span className="mt-1">{label}</span>
    </NavLink>
  );
}

export default function AppShell() {
  return (
    <WorkoutGuardProvider>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
        {/* Content (pad for fixed tab bar) */}
        <main className="flex-1 overflow-y-auto pb-20">
          <Outlet />
        </main>

        {/* Olympus bottom nav (fixed) */}
        <nav className="fixed bottom-0 inset-x-0 z-30 bg-slate-950/90 backdrop-blur border-t border-yellow-400/20">
          <div className="mx-auto max-w-md px-2 py-2 grid grid-cols-5 gap-1">
            {tabs.map((t) => (
              <TabLink key={t.to} {...t} />
            ))}
          </div>
          {/* iOS safe area */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      </div>
    </WorkoutGuardProvider>
  );
}
