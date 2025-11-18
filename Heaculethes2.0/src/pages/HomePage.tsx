import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import type { WorkoutDoc, WorkoutSet } from "../types/workout";

type FirestoreWorkout = {
  title: string;
  description?: string;
  durationSeconds: number;
  totalVolumeKg: number;
  totalDoneSets: number;
  startedAt?: { toDate: () => Date };
  finishedAt?: { toDate: () => Date };
  createdAt?: { toDate: () => Date };
  sets: WorkoutSet[];
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatDateLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function groupSetsByExercise(sets: WorkoutSet[]) {
  const map = new Map<
    string,
    { name: string; count: number }
  >();

  for (const s of sets) {
    const key = s.exerciseId || s.exerciseName;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { name: s.exerciseName, count: 1 });
    }
  }

  return Array.from(map.values());
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutDoc[] | null>(null);

  useEffect(() => {
    if (!user) {
      setWorkouts(null);
      return;
    }

    const workoutsCol = collection(db, "users", user.uid, "workouts");
    const q = query(workoutsCol, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const items: WorkoutDoc[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as unknown as FirestoreWorkout;
        const createdAt = data.createdAt?.toDate() ?? null;
        const startedAt = data.startedAt?.toDate() ?? createdAt ?? new Date();
        const finishedAt = data.finishedAt?.toDate() ?? startedAt;

        items.push({
          id: docSnap.id,
          title: data.title ?? "Workout",
          description: data.description,
          createdAt,
          startedAt: startedAt.getTime(),
          finishedAt: finishedAt.getTime(),
          durationSeconds: data.durationSeconds ?? 0,
          totalVolumeKg: data.totalVolumeKg ?? 0,
          totalDoneSets: data.totalDoneSets ?? 0,
          sets: data.sets ?? [],
        });
      });
      setWorkouts(items);
    });

    return () => unsub();
  }, [user]);

  const hasWorkouts = useMemo(
    () => !!workouts && workouts.length > 0,
    [workouts]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-4 pt-4 pb-3 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Home</h1>
        <p className="text-sm text-slate-400">
          Welcome back{user?.email ? `, ${user.email}` : ""}.
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {!user && (
          <p className="text-sm text-slate-400">
            Log in to start tracking your workouts.
          </p>
        )}

        {user && !workouts && (
          <p className="text-sm text-slate-400">Loading workouts…</p>
        )}

        {user && workouts && !hasWorkouts && (
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <div className="h-14 w-14 rounded-full border border-slate-700 flex items-center justify-center">
              <span className="text-2xl">🏋️‍♂️</span>
            </div>
            <div>
              <p className="font-semibold">No workouts yet</p>
              <p className="text-xs text-slate-400">
                Start your first workout from the Exercises tab.
              </p>
            </div>
          </div>
        )}

        {hasWorkouts && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300">
              Recent workouts
            </h2>

            {workouts!.map((w) => {
              const createdDate =
                w.createdAt ?? new Date(w.startedAt);
              const label = formatDateLabel(createdDate);

              const grouped = groupSetsByExercise(w.sets);
              const preview = grouped.slice(0, 3);
              const remaining = Math.max(grouped.length - 3, 0);

              return (
                <button
                  key={w.id}
                  onClick={() => navigate(`/workouts/${w.id}`)}
                  className="w-full text-left rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-2 hover:border-blue-500/60 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {w.title || "Workout"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {label}
                      </p>
                    </div>
                  </div>

                  {w.description && (
                    <p className="text-xs text-slate-400 mt-1">
                      {w.description}
                    </p>
                  )}

                  <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-slate-300">
                    <div>
                      <p className="uppercase tracking-wide text-[10px] text-slate-500">
                        Time
                      </p>
                      <p>{formatDuration(w.durationSeconds)}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-[10px] text-slate-500">
                        Volume
                      </p>
                      <p>{w.totalVolumeKg} kg</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-[10px] text-slate-500">
                        Sets
                      </p>
                      <p>{w.totalDoneSets}</p>
                    </div>
                  </div>

                  {preview.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {preview.map((ex) => (
                        <div
                          key={ex.name}
                          className="flex items-center gap-3 text-xs"
                        >
                          <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                            🧍
                          </div>
                          <p className="text-slate-200">
                            <span className="font-semibold">
                              {ex.count} set
                              {ex.count > 1 ? "s" : ""}
                            </span>{" "}
                            {ex.name}
                          </p>
                        </div>
                      ))}
                      {remaining > 0 && (
                        <p className="text-[11px] text-blue-400">
                          See {remaining} more exercise
                          {remaining > 1 ? "s" : ""} →
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
