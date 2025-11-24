// src/pages/WorkoutDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";
import type { WorkoutDoc, WorkoutSet } from "../types/workout";

// Optional: add a background image to the header if you like
// import OLYMPUS_BG_URL from "../assets/Olympus2.jpg";

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

function formatFullDate(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type MuscleSplitRow = {
  muscle: string;
  volume: number;
  percent: number;
};

function computeMuscleSplit(sets: WorkoutSet[]): MuscleSplitRow[] {
  const map = new Map<string, number>();
  for (const s of sets) {
    const vol = (s.weight || 0) * (s.reps || 0);
    const muscle = s.muscleGroup || "Other";
    map.set(muscle, (map.get(muscle) ?? 0) + vol);
  }
  const entries = Array.from(map.entries());
  const total = entries.reduce((sum, [, vol]) => sum + vol, 0) || 1;

  return entries
    .map(([muscle, volume]) => ({
      muscle,
      volume,
      percent: Math.round((volume / total) * 100),
    }))
    .sort((a, b) => b.volume - a.volume);
}

function groupSetsByExercise(sets: WorkoutSet[]) {
  const map = new Map<
    string,
    { name: string; muscleGroup: string; sets: WorkoutSet[] }
  >();

  for (const s of sets) {
    const key = s.exerciseId || s.exerciseName;
    const existing = map.get(key);
    if (existing) {
      existing.sets.push(s);
    } else {
      map.set(key, {
        name: s.exerciseName,
        muscleGroup: s.muscleGroup,
        sets: [s],
      });
    }
  }
  return Array.from(map.values());
}

export default function WorkoutDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workout, setWorkout] = useState<WorkoutDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!user || !id) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid, "workouts", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setWorkout(null);
          setLoading(false);
          return;
        }

        const data = snap.data() as unknown as FirestoreWorkout;

        const createdAt = data.createdAt?.toDate() ?? null;
        const startedAt = data.startedAt?.toDate() ?? createdAt ?? new Date();
        const finishedAt = data.finishedAt?.toDate() ?? startedAt;

        setWorkout({
          id: snap.id,
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
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [user, id]);

  const muscleSplit = useMemo(
    () => (workout ? computeMuscleSplit(workout.sets) : []),
    [workout]
  );

  const groupedExercises = useMemo(
    () => (workout ? groupSetsByExercise(workout.sets) : []),
    [workout]
  );

  if (!user) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-400">
          You must be logged in to view workout details.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-4">
        <p className="text-sm text-slate-400">Loading workout…</p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-4">
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-yellow-200/80 hover:text-yellow-200 mb-3"
        >
          ⟵ Back
        </button>
        <p className="text-sm text-slate-300">Workout not found.</p>
      </div>
    );
  }

  const startedDate = new Date(workout.startedAt);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Olympus header */}
      <header
        className="relative border-b border-slate-800"
        // Uncomment to use a background image:
        // style={{
        //   backgroundImage: `linear-gradient(to bottom, rgba(2,6,23,0.70), rgba(2,6,23,0.9)), url(${OLYMPUS_BG_URL})`,
        //   backgroundSize: "cover",
        //   backgroundPosition: "center",
        // }}
      >
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="text-xs text-yellow-200/80 hover:text-yellow-200"
            >
              ⟵ Back
            </button>
            <div className="flex items-center gap-2 text-[11px] text-yellow-200/80">
              <span className="hidden sm:inline">
                {formatFullDate(startedDate)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-300 flex items-center justify-center shadow-[0_0_0_2px_rgba(234,179,8,0.3)]">
              <span className="text-slate-900 text-lg">Λ</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400">
                {workout.title}
              </h1>
              <p className="text-[11px] uppercase tracking-wide text-yellow-200/80">
                Recorded in the Hall of Records
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Stats + Description */}
        <section className="rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-4 space-y-3">
          {workout.description && (
            <p className="text-sm text-slate-100">{workout.description}</p>
          )}

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-slate-950/50 border border-yellow-400/20 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
                Time
              </p>
              <p className="mt-0.5 text-slate-100">
                {formatDuration(workout.durationSeconds)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/50 border border-yellow-400/20 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
                Volume
              </p>
              <p className="mt-0.5 text-slate-100">{workout.totalVolumeKg} kg</p>
            </div>
            <div className="rounded-xl bg-slate-950/50 border border-yellow-400/20 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
                Sets
              </p>
              <p className="mt-0.5 text-slate-100">{workout.totalDoneSets}</p>
            </div>
          </div>
        </section>

        {/* Muscle split */}
        {muscleSplit.length > 0 && (
          <section className="rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-yellow-100">Muscle Split</h2>
            <div className="space-y-3">
              {muscleSplit.map((row) => (
                <div key={row.muscle} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-200">
                    <span>{row.muscle}</span>
                    <span>{row.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Exercises & sets */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-yellow-100">Workout</h2>

          {groupedExercises.map((ex) => (
            <div
              key={ex.name}
              className="rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-3 space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-xl">
                  🏋️‍♂️
                </div>
                <div>
                  <p className="text-sm font-semibold text-yellow-100">
                    {ex.name}
                  </p>
                  <p className="text-[11px] text-yellow-200/80">
                    {ex.muscleGroup}
                  </p>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-400 grid grid-cols-3 gap-2 px-1">
                <span>Set</span>
                <span>Weight × Reps</span>
                <span className="text-right">Done</span>
              </div>

              {ex.sets.map((s, idx) => (
                <div
                  key={s.id}
                  className="mt-1 grid grid-cols-3 gap-2 items-center rounded-xl px-2 py-1 bg-slate-950/50 border border-yellow-400/15"
                >
                  <span className="text-xs text-slate-300">{idx + 1}</span>
                  <span className="text-xs text-slate-200">
                    {s.weight} kg × {s.reps} reps
                  </span>
                  <span className="text-xs text-right">
                    {s.done ? (
                      <span className="inline-block px-2 py-[2px] rounded-full bg-emerald-500/20 text-emerald-300">
                        ✓
                      </span>
                    ) : (
                      "–"
                    )}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {groupedExercises.length === 0 && (
            <p className="text-xs text-slate-400">
              No sets found for this workout.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
