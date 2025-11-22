// src/pages/ExercisesPage.tsx
import { useNavigate } from "react-router-dom";

export default function ExercisesPage() {
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Exercises</h1>
        <p className="text-slate-400 text-sm">
          Start a new workout and log your sets.
        </p>
      </header>

      {/* Weight training card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">
          Weight training
        </h2>
        <p className="text-xs text-slate-400">
          Create an empty workout and add exercises as you go.
        </p>

        {/* Animated Start Button with dumbbell */}
        <button
          onClick={() => navigate("/weight-workout")}
          className="
            mt-4 w-full py-3 rounded-xl
            bg-blue-600 font-semibold text-sm
            hover:bg-blue-500 active:bg-blue-700
            transition-all duration-300
            transform hover:-translate-y-1
            shadow-lg shadow-blue-500/20
            flex items-center justify-center gap-2
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-white animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 14V10M18 14V10M4 12H6M18 12H20M8 12H16" />
          </svg>
          <span>Start Workout</span>
        </button>
      </div>

      {/* Go for a run card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Go for a run</h2>
        <p className="text-xs text-slate-400">
          Track your route, distance, pace and time outdoors.
        </p>

        <button
          onClick={() => navigate("/go-run")}
          className="
            mt-4 w-full py-3 rounded-xl
            bg-emerald-600 font-semibold text-sm
            hover:bg-emerald-500 active:bg-emerald-700
            transition-all duration-300
            transform hover:-translate-y-1
            shadow-lg shadow-emerald-500/20
            flex items-center justify-center gap-2
          "
        >
          <span className="text-lg">🏃‍♂️</span>
          <span>Start a run</span>
        </button>
      </div>
    </div>
  );
}
