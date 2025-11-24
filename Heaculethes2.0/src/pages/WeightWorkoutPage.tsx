// src/pages/WeightWorkoutPage.tsx
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type {
  WorkoutExercise,
  WorkoutSet,
  WorkoutSummary,
} from "../types/workout";
import useUnsavedChanges from "../hooks/useUnsavedChanges";
import { useWorkoutGuard } from "../guards/WorkoutGuard";

const EXERCISES: WorkoutExercise[] = [
  { id: "squat", name: "Squat (Barbell)", muscleGroup: "Quadriceps" },
  { id: "bench", name: "Bench Press (Barbell)", muscleGroup: "Chest" },
  { id: "deadlift", name: "Deadlift (Barbell)", muscleGroup: "Posterior chain" },
  { id: "ohp", name: "Overhead Press (Barbell)", muscleGroup: "Shoulders" },
  { id: "row", name: "Bent-over Row (Barbell)", muscleGroup: "Back" },
  { id: "lat-pulldown", name: "Lat Pulldown", muscleGroup: "Lats" },
  { id: "curl", name: "Biceps Curl (Dumbbell)", muscleGroup: "Biceps" },
  { id: "tricep-pushdown", name: "Tricep Pushdown", muscleGroup: "Triceps" },
];

// LocalStorage key for in-progress workouts
const DRAFT_KEY = "herculethes.weightworkout.draft";

export default function WeightWorkoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setDirty } = useWorkoutGuard();

  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0); // seconds
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] =
    useState<WorkoutExercise | null>(null);

  // Restore any saved draft on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const draft = JSON.parse(raw) as {
        startedAt: number;
        sets: WorkoutSet[];
        elapsedAtSave: number;
        savedAt: number;
      };

      const restore = window.confirm("Resume in-progress workout?");
      if (restore) {
        setStartedAt(draft.startedAt || Date.now());
        setSets(Array.isArray(draft.sets) ? draft.sets : []);
        setElapsed(draft.elapsedAtSave || 0);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  // Stopwatch
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const filteredExercises = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return EXERCISES;
    return EXERCISES.filter(
      (e) =>
        e.name.toLowerCase().includes(s) ||
        e.muscleGroup.toLowerCase().includes(s)
    );
  }, [search]);

  const totalDoneSets = useMemo(
    () => sets.filter((s) => s.done).length,
    [sets]
  );

  const totalVolumeKg = useMemo(
    () =>
      sets
        .filter((s) => s.done)
        .reduce((sum, s) => sum + s.weight * s.reps, 0),
    [sets]
  );

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  };

  const handleAddExercise = () => {
    setShowPicker(true);
    setSearch("");
    setSelectedExercise(null);
  };

  const confirmAddExercise = () => {
    if (!selectedExercise) return;
    const newSet: WorkoutSet = {
      id: crypto.randomUUID(),
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      muscleGroup: selectedExercise.muscleGroup,
      weight: 0,
      reps: 0,
      done: false,
    };
    setSets((prev) => [...prev, newSet]);
    setShowPicker(false);
  };

  const handleSetChange = (
    setId: string,
    field: "weight" | "reps",
    value: string
  ) => {
    const numeric = Number(value.replace(",", "."));
    setSets((prev) =>
      prev.map((s) =>
        s.id === setId
          ? {
              ...s,
              [field]: Number.isNaN(numeric) ? 0 : numeric,
            }
          : s
      )
    );
  };

  const toggleSetDone = (setId: string) => {
    setSets((prev) =>
      prev.map((s) => (s.id === setId ? { ...s, done: !s.done } : s))
    );
  };

  const deleteSet = (setId: string) => {
    setSets((prev) => prev.filter((s) => s.id !== setId));
  };

  const addAnotherSetForExercise = (exerciseId: string) => {
    const lastSet = [...sets].reverse().find((s) => s.exerciseId === exerciseId);
    if (!lastSet) return;
    const newSet: WorkoutSet = {
      ...lastSet,
      id: crypto.randomUUID(),
      done: false,
    };
    setSets((prev) => [...prev, newSet]);
  };

  // Dirty state & unsaved-changes guard
  const isDirty = sets.length > 0 || elapsed > 10;
  useUnsavedChanges(isDirty);

  // Broadcast dirty state to the layout (for tab blocking)
  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false); // clear on unmount
  }, [isDirty, setDirty]);

  // Autosave draft whenever core state changes
  useEffect(() => {
    if (!isDirty) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          startedAt,
          sets,
          elapsedAtSave: elapsed,
          savedAt: Date.now(),
        })
      );
    } catch {
      // ignore quota errors
    }
  }, [startedAt, sets, elapsed, isDirty]);

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  const handleDiscard = () => {
    const ok = window.confirm("Discard this workout?");
    if (!ok) return;
    clearDraft();
    setDirty(false);
    navigate("/exercises");
  };

  const handleFinish = () => {
    if (!sets.length) {
      setDirty(false);
      navigate("/exercises");
      return;
    }

    const summary: WorkoutSummary = {
      startedAt,
      finishedAt: Date.now(),
      durationSeconds: elapsed,
      totalVolumeKg,
      totalDoneSets,
      sets,
    };

    clearDraft();
    setDirty(false);
    navigate("/save-workout", { state: summary });
  };

  if (!user) {
    return (
      <div className="p-4">
        <p className="text-slate-400 text-sm">
          You must be logged in to record workouts.
        </p>
      </div>
    );
  }

  const exercisesInWorkout = Array.from(
    new Map(
      sets.map((s) => [
        s.exerciseId,
        { id: s.exerciseId, name: s.exerciseName, muscleGroup: s.muscleGroup },
      ])
    ).values()
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: duration, volume, sets + Finish */}
      <header className="px-4 pt-3 pb-2 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleDiscard}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            ⟵ Log Workout
          </button>
          <button
            onClick={handleFinish}
            className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold hover:bg-blue-500"
          >
            Finish
          </button>
        </div>

        <div className="flex gap-4 text-xs text-slate-300">
          <div>
            <p className="uppercase tracking-wide text-[10px] text-slate-500">
              Duration
            </p>
            <p>{formatDuration(elapsed)}</p>
          </div>
          <div>
            <p className="uppercase tracking-wide text-[10px] text-slate-500">
              Volume
            </p>
            <p>{totalVolumeKg} kg</p>
          </div>
          <div>
            <p className="uppercase tracking-wide text-[10px] text-slate-500">
              Sets
            </p>
            <p>{totalDoneSets}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {exercisesInWorkout.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <div className="h-14 w-14 rounded-full border border-slate-700 flex items-center justify-center">
              <span className="text-2xl">🏋️‍♂️</span>
            </div>
            <div>
              <p className="font-semibold">Get started</p>
              <p className="text-xs text-slate-400">
                Add an exercise to start your workout.
              </p>
            </div>
          </div>
        ) : (
          exercisesInWorkout.map((ex) => (
            <section
              key={ex.id}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-xl">
                    🧍
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-400">
                      {ex.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {ex.muscleGroup}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-500 grid grid-cols-4 gap-2 px-1">
                <span>Set</span>
                <span>Kg</span>
                <span>Reps</span>
                <span className="text-right">Done</span>
              </div>

              {sets
                .filter((s) => s.exerciseId === ex.id)
                .map((s, idx) => (
                  <div
                    key={s.id}
                    className={`mt-1 grid grid-cols-4 gap-2 items-center rounded-xl px-2 py-1 ${
                      s.done ? "bg-emerald-700/40" : "bg-slate-900"
                    }`}
                  >
                    <span className="text-xs text-slate-300">
                      {idx + 1}
                    </span>
                    <input
                      className="text-xs w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-slate-50 outline-none focus:border-blue-500"
                      value={s.weight || ""}
                      onChange={(e) =>
                        handleSetChange(s.id, "weight", e.target.value)
                      }
                      inputMode="decimal"
                    />
                    <input
                      className="text-xs w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-slate-50 outline-none focus:border-blue-500"
                      value={s.reps || ""}
                      onChange={(e) =>
                        handleSetChange(s.id, "reps", e.target.value)
                      }
                      inputMode="numeric"
                    />
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => toggleSetDone(s.id)}
                        className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold ${
                          s.done
                            ? "bg-emerald-500 text-slate-900"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSet(s.id)}
                        className="h-6 w-6 rounded-md bg-slate-800 text-[11px] text-slate-400 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

              <button
                type="button"
                onClick={() => addAnotherSetForExercise(ex.id)}
                className="mt-2 text-[11px] text-blue-400 hover:underline"
              >
                + Add set
              </button>
            </section>
          ))
        )}
      </main>

      {/* Bottom actions */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-3 flex gap-3">
        <button
          onClick={handleDiscard}
          className="flex-1 rounded-xl border border-red-600/60 text-red-400 text-sm py-2 font-semibold hover:bg-red-900/20"
        >
          Discard workout
        </button>
        <button
          onClick={handleAddExercise}
          className="flex-1 rounded-xl bg-blue-600 text-sm py-2 font-semibold hover:bg-blue-500"
        >
          + Add exercise
        </button>
      </footer>

      {/* Exercise picker overlay */}
      {showPicker && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60">
          <div className="w-full max-w-md rounded-t-3xl bg-slate-950 border-t border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <button
                className="text-sm text-slate-400"
                onClick={() => setShowPicker(false)}
              >
                Cancel
              </button>
              <p className="text-xs font-semibold text-slate-300">
                Add Exercise
              </p>
              <button
                className="text-sm text-blue-400 disabled:opacity-40"
                disabled={!selectedExercise}
                onClick={confirmAddExercise}
              >
                Add
              </button>
            </div>

            <input
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 outline-none focus:border-blue-500"
              placeholder="Search exercise or muscle"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="max-h-72 overflow-y-auto mt-1 space-y-1">
              {filteredExercises.map((ex) => {
                const isSelected = selectedExercise?.id === ex.id;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setSelectedExercise(ex)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left ${
                      isSelected ? "bg-blue-600/30" : "bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-xl">
                        🏋️‍♂️
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-50">
                          {ex.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {ex.muscleGroup}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredExercises.length === 0 && (
                <p className="text-xs text-slate-500 px-1 py-2">
                  No exercises match that search.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
