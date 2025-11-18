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

      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">
          Weight training
        </h2>
        <p className="text-xs text-slate-400">
          Create an empty workout and add exercises as you go.
        </p>

        <button
          onClick={() => navigate("/weight-workout")}
          className="mt-2 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 active:bg-blue-700"
        >
          Start empty workout
        </button>
      </div>
    </div>
  );
}
