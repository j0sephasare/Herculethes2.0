import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import { updateProfile } from "firebase/auth";

import { useAuth } from "../auth/AuthContext";
import { auth, db, storage } from "../firebase";
import type { WorkoutDoc, WorkoutSet } from "../types/workout";
import { useNavigate } from "react-router-dom";
import ProgressDashboard from "../components/ProgressDashboard";

// Olympus hero art (same as other pages)
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
  media?: string[]; // NEW: optional media URLs to clean up on delete
};

type ProfileData = {
  displayName?: string;
  photoURL?: string;
};

function formatDuration(sec: number) {
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes.toString().padStart(2, "0")} min`;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<(WorkoutDoc & { media?: string[] })[] | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Load profile from Firestore
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileRef = doc(db, "profiles", user.uid);
    const unsub = onSnapshot(profileRef, (snap) => {
      const data = snap.data() as ProfileData | undefined;
      setProfile(data ?? {});
    });

    return () => unsub();
  }, [user]);

  // Derived display name + stats
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-4">
        <h1 className="text-2xl font-bold mb-2">Profile</h1>
        <p className="text-sm text-slate-400">
          You need to be logged in to view your profile.
        </p>
      </div>
    );
  }

  const email = user.email ?? "";
  const fallbackName =
    (profile?.displayName && profile.displayName.trim()) ||
    (user.displayName && user.displayName.trim()) ||
    (email && email.includes("@") ? email.split("@")[0] : "Athlete");

  useEffect(() => {
    setEditName(fallbackName);
  }, [fallbackName]);

  const avatarUrl = profile?.photoURL || user.photoURL || null;
  const initial = fallbackName.charAt(0).toUpperCase();

  const hasWorkouts = workouts && workouts.length > 0;
  const recent = workouts?.slice(0, 3) ?? [];

  const stats = useMemo(() => {
    if (!workouts || workouts.length === 0) {
      return {
        totalWorkouts: 0,
        totalVolumeKg: 0,
        totalSets: 0,
        totalDurationSeconds: 0,
      };
    }

    return workouts.reduce(
      (acc, w) => ({
        totalWorkouts: acc.totalWorkouts + 1,
        totalVolumeKg: acc.totalVolumeKg + (w.totalVolumeKg || 0),
        totalSets: acc.totalSets + (w.totalDoneSets || 0),
        totalDurationSeconds:
          acc.totalDurationSeconds + (w.durationSeconds || 0),
      }),
      {
        totalWorkouts: 0,
        totalVolumeKg: 0,
        totalSets: 0,
        totalDurationSeconds: 0,
      }
    );
  }, [workouts]);

  // Handlers
  const handleNameSave = async () => {
    const trimmed = editName.trim();
    if (!trimmed || !user) return;

    setSavingName(true);
    setError(null);

    try {
      const profileRef = doc(db, "profiles", user.uid);
      await setDoc(profileRef, { displayName: trimmed }, { merge: true });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmed });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    setError(null);

    try {
     const avatarRef = ref(storage, `avatars/${user.uid}/avatar_${Date.now()}_${file.name}`);

      await uploadBytes(avatarRef, file);
      const url = await getDownloadURL(avatarRef);

      const profileRef = doc(db, "profiles", user.uid);
      await setDoc(profileRef, { photoURL: url }, { merge: true });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: url });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to upload profile picture. Please try again.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // Delete workout (with optional media cleanup)
  const handleDeleteWorkout = async (w: WorkoutDoc & { media?: string[] }) => {
    if (!user) return;

    const confirmed = window.confirm(
      `Delete "${w.title || "Workout"}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setError(null);
    setDeletingId(w.id);
    try {
      // Best-effort: delete media files referenced by URL (if any)
      if (w.media && w.media.length) {
        await Promise.allSettled(
          w.media.map(async (url) => {
            try {
              const r = ref(storage, url); // accepts gs:// or https URL
              await deleteObject(r);
            } catch (err) {
              // ignore individual failures (file might already be gone)
              console.warn("Failed to delete media file:", err);
            }
          })
        );
      }

      // Delete Firestore document (this drives UI via onSnapshot)
      const workoutRef = doc(db, "users", user.uid, "workouts", w.id);
      await deleteDoc(workoutRef);
    } catch (err) {
      console.error(err);
      setError("Failed to delete workout. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Olympus hero */}
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
              Profile
            </h1>
            <p className="mt-1 text-xs sm:text-sm tracking-wide uppercase text-yellow-200/80">
              Your training overview
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* User card + avatar */}
        <section className="rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-4 flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-16 w-16 rounded-full object-cover border border-yellow-400/20"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-300 text-slate-900 flex items-center justify-center text-2xl font-extrabold border border-yellow-400/40">
                {initial}
              </div>
            )}

            <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-slate-900 border border-yellow-400/30 flex items-center justify-center text-[11px] cursor-pointer hover:bg-slate-800">
              {uploadingAvatar ? "…" : "✎"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-md bg-slate-950/40 border border-yellow-400/20 px-2 py-1 text-sm outline-none focus:border-yellow-400/50"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <button
                onClick={handleNameSave}
                disabled={savingName || editName.trim() === fallbackName}
                className="text-xs px-3 py-1 rounded-md bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-900 font-semibold hover:from-yellow-400 hover:to-amber-300 disabled:opacity-60 shadow-[0_8px_24px_rgba(234,179,8,0.25)]"
              >
                {savingName ? "Saving…" : "Save"}
              </button>
            </div>
            <p className="text-xs text-slate-400">{email}</p>
          </div>
        </section>

        {/* Progress & Analytics Dashboard */}
        <section>
          <ProgressDashboard workouts={workouts ?? []} />
        </section>

        {/* Lifetime stats */}
        <section className="rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-200/90">
            Lifetime Stats
          </h2>
          {!hasWorkouts && (
            <p className="text-xs text-slate-400">
              Log your first workout to start tracking your progress.
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl bg-slate-950/40 border border-yellow-400/20 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
                Workouts
              </p>
              <p className="mt-1 text-base font-semibold text-slate-100">
                {stats.totalWorkouts}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/40 border border-yellow-400/20 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
                Volume
              </p>
              <p className="mt-1 text-base font-semibold text-slate-100">
                {stats.totalVolumeKg} kg
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/40 border border-yellow-400/20 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
                Sets
              </p>
              <p className="mt-1 text-base font-semibold text-slate-100">
                {stats.totalSets}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/40 border border-yellow-400/20 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
                Time trained
              </p>
              <p className="mt-1 text-base font-semibold text-slate-100">
                {formatDuration(stats.totalDurationSeconds)}
              </p>
            </div>
          </div>
        </section>

        {/* Recent workouts preview (with delete) */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-200/90">
            Recent Workouts
          </h2>
          {!hasWorkouts && (
            <p className="text-xs text-slate-400">
              Your workouts will appear here once you start logging them.
            </p>
          )}

          {recent.map((w) => {
            const date = w.createdAt ?? new Date(w.startedAt);
            const label = date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });

            const isDeleting = deletingId === w.id;

            return (
              <div
                key={w.id}
                className="rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-3 hover:border-yellow-400/35 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-100">
                      {w.title}
                    </p>
                    <p className="text-[11px] text-slate-400">{label}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/workouts/${w.id}`)}
                      className="text-[11px] px-2 py-1 rounded-md border border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/10"
                    >
                      View
                    </button>
                    <button
                      disabled={isDeleting}
                      onClick={() => handleDeleteWorkout(w)}
                      className="text-[11px] px-2 py-1 rounded-md border border-red-500/50 text-red-300 hover:bg-red-900/20 disabled:opacity-60"
                      title="Delete workout"
                    >
                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-200">
                  <div>
                    <p className="uppercase tracking-wide text-[9px] text-yellow-200/70">
                      Time
                    </p>
                    <p>{formatDuration(w.durationSeconds)}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-[9px] text-yellow-200/70">
                      Volume
                    </p>
                    <p>{w.totalVolumeKg} kg</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-[9px] text-yellow-200/70">
                      Sets
                    </p>
                    <p>{w.totalDoneSets}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Account actions */}
        <section className="space-y-2">
          <button
            onClick={() => navigate("/macros")}
            className="w-full rounded-xl border border-yellow-400/30 text-yellow-200 text-sm py-2 font-semibold hover:bg-yellow-500/10"
          >
            Open Macro Calculator
          </button>

          <button
            onClick={() => navigate("/gyms")}
            className="w-full rounded-xl border border-yellow-400/30 text-yellow-200 text-sm py-2 font-semibold hover:bg-yellow-500/10"
          >
            Find Gyms Near Me
          </button>

          <button
            onClick={logout}
            className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-900 text-sm py-2 font-semibold hover:from-yellow-400 hover:to-amber-300"
          >
            Log Out
          </button>
        </section>
      </main>
    </div>
  );
}
