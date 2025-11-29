import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, orderBy, query, doc } from "firebase/firestore";

import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import type { WorkoutDoc, WorkoutSet } from "../types/workout";

// Background art used in the hero banner (same as Login)
import OLYMPUS_BG_URL from "../assets/Olympus2.jpg";

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
  media?: string[]; // media URLs (images/videos)
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
  const map = new Map<string, { name: string; count: number }>();
  for (const s of sets) {
    const key = s.exerciseId || s.exerciseName;
    const existing = map.get(key);
    if (existing) existing.count += 1;
    else map.set(key, { name: s.exerciseName, count: 1 });
  }
  return Array.from(map.values());
}

// crude detector for video URLs (checks extension before any ?query)
const isVideoUrl = (url: string) => {
  const clean = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogg)$/.test(clean);
};

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workouts, setWorkouts] = useState<(WorkoutDoc & { media?: string[] })[] | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  // Load workouts
  useEffect(() => {
    if (!user) {
      setWorkouts(null);
      return;
    }

    const workoutsCol = collection(db, "users", user.uid, "workouts");
    const q = query(workoutsCol, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const items: (WorkoutDoc & { media?: string[] })[] = [];
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
          media: data.media ?? [],
        });
      });
      setWorkouts(items);
    });

    return () => unsub();
  }, [user]);

  // Load profile displayName for greeting
  useEffect(() => {
    if (!user) {
      setProfileName(null);
      return;
    }

    const profileRef = doc(db, "profiles", user.uid);
    const unsub = onSnapshot(profileRef, (snap) => {
      const data = snap.data() as { displayName?: string } | undefined;
      if (data?.displayName && data.displayName.trim()) {
        setProfileName(data.displayName.trim());
      } else {
        setProfileName(null);
      }
    });

    return () => unsub();
  }, [user]);

  const hasWorkouts = useMemo(
    () => !!workouts && workouts.length > 0,
    [workouts]
  );

  // Greeting name (no email shown)
  const email = user?.email ?? "";
  const fallbackName =
    email && email.includes("@") ? email.split("@")[0] : "Athlete";
  const greetingName = profileName || fallbackName;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Olympus hero strip */}
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
              Hall of Training
            </h1>
            <p className="mt-1 text-xs sm:text-sm tracking-wide uppercase text-yellow-200/80">
              {user ? `Welcome back, ${greetingName}.` : "Log in to begin your legend."}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {!user && (
          <p className="text-sm text-slate-400">
            You need to be logged in to see your recent workouts.
          </p>
        )}

        {user && !workouts && (
          <p className="text-sm text-slate-400">Loading workouts…</p>
        )}

        {user && workouts && !hasWorkouts && (
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <div className="h-14 w-14 rounded-full border border-yellow-500/40 bg-slate-900 flex items-center justify-center shadow-[0_0_0_1px_rgba(148,163,184,0.15)]">
              <span className="text-2xl">🏛️</span>
            </div>
            <div>
              <p className="font-semibold text-yellow-200">
                No workouts yet
              </p>
              <p className="text-xs text-slate-400">
                Start your first workout from the <span className="text-yellow-300">Exercises</span> tab.
              </p>
            </div>
          </div>
        )}

        {hasWorkouts && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-200/80">
              Recent Workouts
            </h2>

            {workouts!.map((w) => {
              const createdDate = w.createdAt ?? new Date(w.startedAt);
              const label = formatDateLabel(createdDate);

              const grouped = groupSetsByExercise(w.sets);
              const preview = grouped.slice(0, 3);
              const remaining = Math.max(grouped.length - 3, 0);

              // choose first media as thumbnail (prefer image; fallback to video)
              let mediaUrl: string | null = null;
              if (w.media && w.media.length) {
                const firstImage = w.media.find((u) => !isVideoUrl(u));
                mediaUrl = firstImage || w.media[0];
              }

              return (
                <button
                  key={w.id}
                  onClick={() => navigate(`/workouts/${w.id}`)}
                  className="w-full text-left rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-[0_0_0_1px_rgba(234,179,8,0.25)] transition overflow-hidden"
                >
                  {/* MAIN CONTENT FIRST */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {w.title || "Workout"}
                        </p>
                        <p className="text-xs text-slate-400">{label}</p>
                      </div>
                      <div className="text-yellow-300 text-lg">⚡</div>
                    </div>

                    {w.description && (
                      <p className="text-xs text-slate-300/90 mt-1">
                        {w.description}
                      </p>
                    )}

                    <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-slate-200">
                      <div>
                        <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
                          Time
                        </p>
                        <p>{formatDuration(w.durationSeconds)}</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
                          Volume
                        </p>
                        <p>{w.totalVolumeKg} kg</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
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
                            <div className="h-8 w-8 rounded-full bg-slate-800 border border-yellow-400/20 flex items-center justify-center text-lg">
                              🏋️
                            </div>
                            <p className="text-slate-200">
                              <span className="font-semibold text-yellow-200">
                                {ex.count} set{ex.count > 1 ? "s" : ""}
                              </span>{" "}
                              {ex.name}
                            </p>
                          </div>
                        ))}
                        {remaining > 0 && (
                          <p className="text-[11px] text-yellow-300">
                            See {remaining} more exercise
                            {remaining > 1 ? "s" : ""} →
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* MEDIA UNDERNEATH — UNCROPPED (object-contain) */}
                  {mediaUrl && (
                    <div className="px-4 pb-4">
                      <div className="rounded-xl border border-yellow-400/20 bg-black overflow-hidden flex items-center justify-center">
                        {isVideoUrl(mediaUrl) ? (
                          <video
                            src={mediaUrl}
                            controls
                            playsInline
                            className="w-full max-h-80 object-contain"
                          />
                        ) : (
                          <img
                            src={mediaUrl}
                            alt="workout media"
                            loading="lazy"
                            className="w-full max-h-80 object-contain"
                          />
                        )}
                      </div>
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
