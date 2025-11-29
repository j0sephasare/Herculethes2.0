// src/pages/SaveWorkoutPage.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc as fsDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";

import { db, storage } from "../firebase";
import { useAuth } from "../auth/AuthContext";
import type { WorkoutSummary } from "../types/workout";

// type of the router state
type LocationState = WorkoutSummary | undefined;

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
};

// Helpers for previews
const isImage = (f: File) => /^image\//.test(f.type);
const isVideo = (f: File) => /^video\//.test(f.type);

export default function SaveWorkoutPage() {
  const { state } = useLocation();
  const summary = state as LocationState;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // media state
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0); // 0..100 while uploading

  // Auto-suggest title from first exercise
  const suggestedTitle = useMemo(() => {
    if (!summary || !summary.sets?.length) return "Workout";
    const first = summary.sets[0];
    if (!first?.exerciseName) return "Workout";
    const day = new Date(summary.startedAt).toLocaleDateString(undefined, {
      weekday: "short",
    });
    return `${day} · ${first.exerciseName}`;
  }, [summary]);

  useEffect(() => {
    setTitle(suggestedTitle);
  }, [suggestedTitle]);

  // Guard
  if (!summary || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-4">
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">
          <p className="text-slate-300 text-sm">
            No workout data to save. Returning to exercises…
          </p>
        </div>
      </div>
    );
  }

  // Handle media selection (images/videos), limit to 10 files, ~25MB each
  const handlePick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const picked = Array.from(e.target.files || []);
    const filtered = picked.filter(
      (f) =>
        (isImage(f) || isVideo(f)) &&
        f.size <= 25 * 1024 * 1024 // 25 MB
    );
    const next = [...files, ...filtered].slice(0, 10);
    setFiles(next);

    // build fresh preview URLs
    const urls = next.map((f) => (isImage(f) ? URL.createObjectURL(f) : ""));
    setPreviews(urls);
  };

  const removeFile = (idx: number) => {
    const next = files.slice();
    next.splice(idx, 1);
    setFiles(next);
    const nextPrev = previews.slice();
    nextPrev.splice(idx, 1);
    setPreviews(nextPrev);
  };

  // Save flow:
  // 1) Create a doc with base fields (empty media: [])
  // 2) Upload files to storage under users/{uid}/workouts/{docId}/media/{n}
  // 3) updateDoc media: [urls...]
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setProgress(0);

      // 1) create doc with known id
      const workoutsCol = collection(db, "users", user.uid, "workouts");
      const workoutRef = fsDoc(workoutsCol); // generates an id now

      await setDoc(workoutRef, {
        title: title || "Workout",
        description,
        createdAt: serverTimestamp(),
        startedAt: new Date(summary.startedAt),
        finishedAt: new Date(summary.finishedAt),
        durationSeconds: summary.durationSeconds,
        totalVolumeKg: summary.totalVolumeKg,
        totalDoneSets: summary.totalDoneSets,
        sets: summary.sets,
        media: [], // will fill after uploads
      });

      // 2) upload if any files
      let mediaUrls: string[] = [];
      if (files.length > 0) {
        // Upload sequentially so we can show a sane progress bar
        const urls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const path = `users/${user.uid}/workouts/${workoutRef.id}/media/${Date.now()}_${i}_${f.name}`;
          const ref = storageRef(storage, path);
          const task = uploadBytesResumable(ref, f);

          // per-file progress (we’ll aggregate as average across all files)
          await new Promise<void>((resolve, reject) => {
            task.on(
              "state_changed",
              (snap) => {
                const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
                const overall =
                  (i * 100 + pct) / files.length; // simple average across files
                setProgress(Math.min(100, Math.round(overall)));
              },
              (err) => reject(err),
              async () => {
                const url = await getDownloadURL(task.snapshot.ref);
                urls.push(url);
                resolve();
              }
            );
          });
        }
        mediaUrls = urls;
      }

      // 3) update with media URLs (if any)
      if (mediaUrls.length > 0) {
        await updateDoc(workoutRef, { media: mediaUrls });
      }

      navigate("/exercises");
    } catch (e) {
      console.error(e);
      setError("Failed to save workout. Please try again.");
    } finally {
      setSaving(false);
      setProgress(0);
    }
  };

  const handleDiscard = () => {
    navigate("/exercises");
  };

  // Small grouped preview by exercise
  const previewByExercise = useMemo(() => {
    const map = new Map<
      string,
      { name: string; sets: number; volume: number }
    >();
    for (const s of summary.sets) {
      const key = s.exerciseId || s.exerciseName;
      const prev = map.get(key);
      const vol = (s.weight || 0) * (s.reps || 0);
      if (prev) {
        prev.sets += 1;
        prev.volume += vol;
      } else {
        map.set(key, {
          name: s.exerciseName,
          sets: 1,
          volume: vol,
        });
      }
    }
    return Array.from(map.values());
  }, [summary.sets]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="relative border-b border-slate-800">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="text-xs text-yellow-200/80 hover:text-yellow-200"
            >
              ⟵ Back
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-900 px-4 py-1.5 text-sm font-semibold hover:from-yellow-400 hover:to-amber-300 disabled:opacity-60 shadow-[0_8px_24px_rgba(234,179,8,0.25)]"
            >
              {saving ? (progress > 0 ? `Saving… ${progress}%` : "Saving…") : "Save"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-300 flex items-center justify-center shadow-[0_0_0_2px_rgba(234,179,8,0.3)]">
              <span className="text-slate-900 text-lg">Λ</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400">
                Save Workout
              </h1>
              <p className="text-[11px] uppercase tracking-wide text-yellow-200/80">
                Chronicle today’s training in the Hall of Records
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-5">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Title card */}
        <section className="rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-4 space-y-3">
          <label className="text-xs font-semibold text-yellow-200/80 uppercase tracking-wider">
            Workout Title
          </label>
          <input
            className="w-full rounded-lg bg-slate-900 border border-yellow-400/20 px-3 py-2 text-sm outline-none focus:border-yellow-400/60"
            placeholder="Leg Day, Push, Pull…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-slate-950/50 border border-yellow-400/20 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
                Duration
              </p>
              <p className="mt-0.5 text-slate-100">
                {formatDuration(summary.durationSeconds)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/50 border border-yellow-400/20 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
                Volume
              </p>
              <p className="mt-0.5 text-slate-100">
                {summary.totalVolumeKg} kg
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/50 border border-yellow-400/20 px-3 py-2">
              <p className="uppercase tracking-wide text-[10px] text-yellow-200/70">
                Sets
              </p>
              <p className="mt-0.5 text-slate-100">{summary.totalDoneSets}</p>
            </div>
          </div>
        </section>

        {/* Golden “scroll” summary */}
        <section className="rounded-2xl border border-yellow-400/30 bg-gradient-to-b from-slate-900/70 to-slate-950/70 p-0 overflow-hidden">
          <div className="border-b border-yellow-400/20 px-4 py-3">
            <h2 className="text-sm font-semibold text-yellow-100">Workout Summary</h2>
            <p className="text-[11px] text-yellow-200/70">Exercises grouped by movement</p>
          </div>

          <div className="px-4 py-3 space-y-2">
            {previewByExercise.map((ex) => (
              <div
                key={ex.name}
                className="flex items-center justify-between rounded-xl bg-slate-900/70 border border-yellow-400/15 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                    🧍
                  </div>
                  <p className="text-slate-100 truncate">{ex.name}</p>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <span className="whitespace-nowrap">
                    <span className="text-yellow-200">{ex.sets}</span> set{ex.sets > 1 ? "s" : ""}
                  </span>
                  <span className="whitespace-nowrap">
                    <span className="text-yellow-200">{Math.round(ex.volume)}</span> kg·reps
                  </span>
                </div>
              </div>
            ))}

            {previewByExercise.length === 0 && (
              <p className="text-[11px] text-slate-400">
                No sets recorded. Go back and add some lifts.
              </p>
            )}
          </div>
        </section>

        {/* Media upload */}
        <section className="space-y-2 rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-4">
          <p className="text-xs font-semibold text-yellow-200/80 uppercase tracking-wider">
            Photo / Video
          </p>

          <label
            className="flex h-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-yellow-400/30 text-xs text-yellow-100/80 hover:border-yellow-400/60"
            title="Upload up to 10 images/videos (max 25MB each)"
          >
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handlePick}
              className="hidden"
            />
            <div className="text-center">
              <div className="mb-1">Click to add photos or videos</div>
              <div className="text-[11px] text-yellow-100/60">
                Up to 10 files • Images or short clips • 25MB max each
              </div>
            </div>
          </label>

          {/* Previews grid */}
          {files.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {files.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  className="relative rounded-xl overflow-hidden border border-yellow-400/20 bg-slate-950/40"
                >
                  {/* Image preview if image, fallback chip for video */}
                  {isImage(f) && previews[idx] ? (
                    <img
                      src={previews[idx]}
                      alt={f.name}
                      className="h-28 w-full object-cover"
                    />
                  ) : (
                    <div className="h-28 w-full flex items-center justify-center text-[11px] text-yellow-100/80">
                      🎬 {f.name}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[11px] text-yellow-100 hover:bg-slate-900"
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {saving && progress > 0 && progress < 100 && (
            <div className="mt-2">
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-yellow-100/70">{progress}% uploading…</p>
            </div>
          )}
        </section>

        {/* Notes */}
        <section className="space-y-2 rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-4">
          <label className="text-xs font-semibold text-yellow-200/80 uppercase tracking-wider">
            Description / Notes
          </label>
          <textarea
            className="mt-1 w-full min-h-[100px] rounded-lg bg-slate-900 border border-yellow-400/20 px-3 py-2 text-sm outline-none focus:border-yellow-400/60"
            placeholder="How did your workout go? PRs, form cues, energy levels…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </section>
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
