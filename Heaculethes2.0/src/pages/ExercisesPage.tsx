// src/pages/ExercisesPage.tsx
import { useNavigate } from "react-router-dom";
// same background art used on Login/Home
import OLYMPUS_BG_URL from "../assets/Olympus2.jpg";

export default function ExercisesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Hero header with Olympus vibe */}
      <header
        className="relative border-b border-slate-800"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(2,6,23,0.70), rgba(2,6,23,0.85)), url(${OLYMPUS_BG_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="px-4 py-6 sm:py-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-300 shadow-[0_0_0_2px_rgba(234,179,8,0.35),0_10px_40px_rgba(234,179,8,0.2)] flex items-center justify-center">
              <span className="text-xl text-slate-900">Λ</span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400">
              Exercises
            </h1>
            <p className="mt-1 text-xs sm:text-sm tracking-wide uppercase text-yellow-200/80">
              Start a new workout and log your sets.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Weight training card */}
        <section className="rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-4 space-y-3 hover:border-yellow-400/35 transition">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-yellow-400/20 flex items-center justify-center text-lg">
              🏋️
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                Weight Training
              </h2>
              <p className="text-xs text-slate-400">
                Create an empty workout and add exercises as you go.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/weight-workout")}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-900 font-semibold text-sm shadow-[0_8px_24px_rgba(234,179,8,0.25)] hover:from-yellow-400 hover:to-amber-300 active:from-yellow-500 active:to-amber-400 transition flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 14V10M18 14V10M4 12H6M18 12H20M8 12H16" />
            </svg>
            <span>Start Workout</span>
          </button>
        </section>

        {/* Go for a run card */}
        <section className="rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-4 space-y-3 hover:border-yellow-400/35 transition">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-yellow-400/20 flex items-center justify-center text-lg">
              🏃‍♂️
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                Go for a Run
              </h2>
              <p className="text-xs text-slate-400">
                Track your route, distance, pace and time outdoors.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/go-run")}
            className="mt-4 w-full py-3 rounded-xl bg-emerald-600 text-sm font-semibold hover:bg-emerald-500 active:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(16,185,129,0.25)]"
          >
            <span className="text-lg">⚡</span>
            <span>Start a Run</span>
          </button>
        </section>
      </main>
    </div>
  );
}
