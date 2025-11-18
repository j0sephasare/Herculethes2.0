// src/pages/WeightWorkoutPage.tsx
import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";

type SetItem = {
  id: number;
  exercise: string;
  weight: string;
  reps: string;
};

export default function WeightWorkoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState<SetItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!user) {
    // Should never happen because App gates by auth, but just in case:
    return (
      <div className="p-4">
        <p className="text-slate-400 text-sm">
          You must be logged in to record workouts.
        </p>
      </div>
    );
  }

  const handleAddSet = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!exercise || !weight || !reps) {
      setError("Please enter exercise, weight and reps.");
      return;
    }

    setSets((prev) => [
      ...prev,
      {
        id: Date.now(),
        exercise,
        weight,
        reps,
      },
    ]);

    setExercise("");
    setWeight("");
    setReps("");
  };

  const handleSaveWorkout = async () => {
    if (!sets.length) {
      setError("Add at least one set before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    setInfo(null);

    try {
      const workoutsCol = collection(db, "users", user.uid, "workouts");

      await addDoc(workoutsCol, {
        type: "weight",
        createdAt: serverTimestamp(),
        sets: sets.map((s) => ({
          exercise: s.exercise,
          weight: Number(s.weight),
          reps: Number(s.reps),
        })),
      });

      setInfo("Workout saved!");
      setSets([]);

      // optional: navigate back to Exercises page
      // navigate("/exercises");
    } catch (err: unknown) {
      console.error(err);
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Failed to save workout. Please try again.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-xs text-slate-400 hover:text-slate-200"
      >
        ← Back
      </button>

      <header>
        <h1 className="text-2xl font-bold">Weight workout</h1>
        <p className="text-slate-400 text-sm">
          Log your sets below and save the workout.
        </p>
      </header>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {info && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-200">
          {info}
        </div>
      )}

      <form
        onSubmit={handleAddSet}
        className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end"
      >
        <div>
          <label className="text-xs font-medium text-slate-300">
            Exercise
          </label>
          <input
            className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-blue-500"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            placeholder="Bench press"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300">
            Weight (kg)
          </label>
          <input
            className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-blue-500"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="80"
            inputMode="decimal"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300">
            Reps
          </label>
          <input
            className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-blue-500"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="8"
            inputMode="numeric"
          />
        </div>

        <button
          type="submit"
          className="mt-2 md:mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
        >
          Add set
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-300">
          Current sets
        </h2>
        {sets.length === 0 ? (
          <p className="text-xs text-slate-500">
            No sets added yet.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {sets.map((s) => (
              <li
                key={s.id}
                className="flex justify-between rounded-lg bg-slate-900 border border-slate-800 px-3 py-2"
              >
                <span className="font-medium">{s.exercise}</span>
                <span className="text-slate-300">
                  {s.weight} kg × {s.reps} reps
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        disabled={saving || sets.length === 0}
        onClick={handleSaveWorkout}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save workout"}
      </button>
    </div>
  );
}
