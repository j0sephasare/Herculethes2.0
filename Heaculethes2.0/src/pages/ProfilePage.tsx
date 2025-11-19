// src/pages/ProfilePage.tsx
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { updateProfile } from "firebase/auth";

import { useAuth } from "../auth/AuthContext";
import { auth, db, storage } from "../firebase";
import type { WorkoutDoc, WorkoutSet } from "../types/workout";
import { useNavigate } from "react-router-dom";

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

type DailyVolume = { label: string; volume: number };

function computeDailyVolume(workouts: WorkoutDoc[]): DailyVolume[] {
  // last 7 days including today
  const days: DailyVolume[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const label = d.toLocaleDateString(undefined, {
      weekday: "short",
    });

    const volume = workouts
      .filter((w) => {
        const wd = new Date(w.startedAt);
        const wdKey = wd.toISOString().slice(0, 10);
        return wdKey === key;
      })
      .reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);

    days.push({ label, volume });
  }

  return days;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutDoc[] | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load workouts
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
    // Keep edit field in sync with current name when profile/user changes
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

  const volumeSeries = useMemo(
    () => (workouts ? computeDailyVolume(workouts) : []),
    [workouts]
  );

  const maxVolume =
    volumeSeries.reduce((m, d) => Math.max(m, d.volume), 0) || 1;

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
      const avatarRef = ref(storage, `avatars/${user.uid}`);
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
      // reset file input so same file can be selected again if needed
      e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-4 pt-4 pb-3 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-slate-400">Your training overview.</p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* User card + avatar */}
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-16 w-16 rounded-full object-cover border border-slate-700"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
                {initial}
              </div>
            )}

            <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[11px] cursor-pointer hover:bg-slate-800">
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
                className="flex-1 rounded-md bg-slate-950/40 border border-slate-700 px-2 py-1 text-sm outline-none focus:border-blue-500"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <button
                onClick={handleNameSave}
                disabled={savingName || editName.trim() === fallbackName}
                className="text-xs px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
              >
                {savingName ? "Saving…" : "Save"}
              </button>
            </div>
            {/* Email still visible only here; remove if you want full privacy */}
            <p className="text-xs text-slate-400">{email}</p>
          </div>
        </section>

        {/* Lifetime stats */}
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">
            Lifetime stats
          </h2>
          {!hasWorkouts && (
            <p className="text-xs text-slate-400">
              Log your first workout to start tracking your progress.
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-slate-500">
                Workouts
              </p>
              <p className="mt-1 text-base font-semibold">
                {stats.totalWorkouts}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-slate-500">
                Volume
              </p>
              <p className="mt-1 text-base font-semibold">
                {stats.totalVolumeKg} kg
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-slate-500">
                Sets
              </p>
              <p className="mt-1 text-base font-semibold">
                {stats.totalSets}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-slate-500">
                Time trained
              </p>
              <p className="mt-1 text-base font-semibold">
                {formatDuration(stats.totalDurationSeconds)}
              </p>
            </div>
          </div>
        </section>

        {/* Volume chart (last 7 days) */}
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">
            Volume (last 7 days)
          </h2>
          {!hasWorkouts && (
            <p className="text-xs text-slate-400">
              Your volume chart will appear here once you log workouts.
            </p>
          )}

          {hasWorkouts && (
            <div className="space-y-2">
              {volumeSeries.map((d) => {
                const pct = (d.volume / maxVolume) * 100;
                return (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className="w-10 text-[11px] text-slate-400">
                      {d.label}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-[11px] text-slate-400">
                      {d.volume ? `${d.volume} kg` : "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent workouts preview */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">
            Recent workouts
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

            return (
              <div
                key={w.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 space-y-1"
              >
                <p className="text-sm font-semibold">{w.title}</p>
                <p className="text-[11px] text-slate-400">{label}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                  <div>
                    <p className="uppercase tracking-wide text-[9px] text-slate-500">
                      Time
                    </p>
                    <p>{formatDuration(w.durationSeconds)}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-[9px] text-slate-500">
                      Volume
                    </p>
                    <p>{w.totalVolumeKg} kg</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-[9px] text-slate-500">
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
       {/* Account actions */}
<section className="space-y-2">
  <button
    onClick={() => navigate("/macros")}
    className="w-full rounded-xl border border-blue-600/70 text-blue-400 text-sm py-2 font-semibold hover:bg-blue-900/20"
  >
    Open macro calculator
  </button>

  <button
    onClick={logout}
    className="w-full rounded-xl border border-red-600/70 text-red-400 text-sm py-2 font-semibold hover:bg-red-900/20"
  >
    Log out
  </button>
</section>

      </main>
    </div>
  );
}
