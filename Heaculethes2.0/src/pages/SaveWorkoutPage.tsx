import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";
import type { WorkoutSummary } from "../types/workout";

type LocationState = WorkoutSummary | undefined;

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
};

export default function SaveWorkoutPage() {
  const { state } = useLocation();
  const summary = state as LocationState;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!summary || !user) {
    return (
      <div className="p-4">
        <p className="text-slate-400 text-sm">
          No workout data to save. Returning to exercises…
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const ref = collection(db, "users", user.uid, "workouts");
      await addDoc(ref, {
        title: title || "Workout",
        description,
        createdAt: serverTimestamp(),
        startedAt: new Date(summary.startedAt),
        finishedAt: new Date(summary.finishedAt),
        durationSeconds: summary.durationSeconds,
        totalVolumeKg: summary.totalVolumeKg,
        totalDoneSets: summary.totalDoneSets,
        sets: summary.sets,
      });

      navigate("/exercises");
    } catch (e) {
      console.error(e);
      setError("Failed to save workout. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    navigate("/exercises");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="px-4 pt-4 pb-2 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            ⟵ Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        <h1 className="text-xl font-bold">Save workout</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-3 rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
          <label className="text-xs font-medium text-slate-300">
            Workout title
          </label>
          <input
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Leg day, Push, Pull..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-300">
            <div>
              <p className="uppercase tracking-wide text-[10px] text-slate-500">
                Duration
              </p>
              <p>{formatDuration(summary.durationSeconds)}</p>
            </div>
            <div>
              <p className="uppercase tracking-wide text-[10px] text-slate-500">
                Volume
              </p>
              <p>{summary.totalVolumeKg} kg</p>
            </div>
            <div>
              <p className="uppercase tracking-wide text-[10px] text-slate-500">
                Sets
              </p>
              <p>{summary.totalDoneSets}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
          <p className="text-xs font-medium text-slate-300 mb-1">
            Photo / video
          </p>
          <div className="h-24 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-xs text-slate-500">
            (We&apos;ll enable uploads later)
          </div>
        </div>

        <div className="space-y-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
          <label className="text-xs font-medium text-slate-300">
            Description
          </label>
          <textarea
            className="mt-1 w-full min-h-[80px] rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="How did your workout go? Leave some notes here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </main>

      <footer className="border-t border-slate-800 px-4 py-3">
        <button
          onClick={handleDiscard}
          className="w-full rounded-xl border border-red-600/60 text-red-400 text-sm py-2 font-semibold hover:bg-red-900/20"
        >
          Discard workout
        </button>
      </footer>
    </div>
  );
}
