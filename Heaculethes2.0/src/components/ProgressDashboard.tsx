// src/components/ProgressDashboard.tsx
import React, { useMemo } from "react";

/** Accept both shapes used across the app */
export type WorkoutSet = {
  exerciseName?: string;
  name?: string;
  weight?: number;
  weightKg?: number;
  reps?: number;
};

export type WorkoutDoc = {
  id?: string;
  title?: string;
  startedAt?: number; // epoch ms
  finishedAt?: number; // epoch ms
  durationSeconds?: number;
  totalVolumeKg?: number;
  totalDoneSets?: number;
  sets?: WorkoutSet[];
};

type Props = { workouts: WorkoutDoc[] };

/** Helpers */
const fmtMins = (totalSeconds: number) => {
  const secs = totalSeconds || 0;
  const mins = Math.floor(secs / 60);
  return `${mins}`.padStart(2, "0");
};
const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);

const getSetWeight = (s: WorkoutSet) => s.weight ?? s.weightKg ?? 0;
const getSetName = (s: WorkoutSet) => s.exerciseName ?? s.name ?? "Set";

export default function ProgressDashboard({ workouts }: Props) {
  /** Totals + last 7 days series */
  const { totals, last7 } = useMemo(() => {
    const totals = workouts.reduce(
      (acc, w) => {
        acc.sets += w.totalDoneSets ?? 0;
        acc.volume += w.totalVolumeKg ?? 0;
        acc.time += w.durationSeconds ?? 0;
        return acc;
      },
      { sets: 0, volume: 0, time: 0 }
    );

    const today = new Date();
    const series: { label: string; volume: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      const key = d.toISOString().slice(0, 10);

      const volume = workouts
        .filter((w) => w.startedAt && dayKey(w.startedAt) === key)
        .reduce((sum, w) => sum + (w.totalVolumeKg ?? 0), 0);

      series.push({ label, volume });
    }

    return { totals, last7: series };
  }, [workouts]);

  /** Best volume day */
  const bestVolumeDay = useMemo<{ date: number; volume: number } | null>(() => {
    if (!workouts.length) return null;

    const map = new Map<string, number>();
    for (const w of workouts) {
      if (!w.startedAt) continue;
      const key = dayKey(w.startedAt);
      map.set(key, (map.get(key) ?? 0) + (w.totalVolumeKg ?? 0));
    }

    let bestKey: string | null = null;
    let bestVol = -Infinity;
    map.forEach((vol, key) => {
      if (vol > bestVol) {
        bestVol = vol;
        bestKey = key;
      }
    });

    if (bestKey === null || !isFinite(bestVol)) return null;
    return { date: new Date(bestKey).getTime(), volume: bestVol };
  }, [workouts]);

  /** Best set (heaviest; tie-break by reps) */
  const bestSet = useMemo<WorkoutSet | null>(() => {
    const allSets: WorkoutSet[] = workouts.flatMap((w) => w.sets ?? []);
    if (allSets.length === 0) return null;

    let best: WorkoutSet | null = null;
    for (const s of allSets) {
      const sw = getSetWeight(s);
      const sr = s.reps ?? 0;
      if (!best) {
        best = s;
      } else {
        const bw = getSetWeight(best);
        const br = best.reps ?? 0;
        if (sw > bw || (sw === bw && sr > br)) best = s;
      }
    }
    return best;
  }, [workouts]);

  /** Current streak (consecutive days incl. today with at least one workout) */
  const streak = useMemo<number>(() => {
    if (!workouts.length) return 0;

    const days = new Set(
      workouts
        .map((w) => (w.startedAt ? dayKey(w.startedAt) : ""))
        .filter(Boolean)
    );

    const today = new Date();
    let s = 0;
    while (true) {
      const d = new Date(today);
      d.setDate(today.getDate() - s);
      const key = d.toISOString().slice(0, 10);
      if (days.has(key)) s += 1;
      else break;
    }
    return s;
  }, [workouts]);

  const maxLast7 = last7.reduce((m, d) => Math.max(m, d.volume), 0) || 1;

  return (
    <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-4">
      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
          <p className="uppercase tracking-wide text-[10px] text-slate-500">Total Sets</p>
          <p className="mt-1 text-base font-semibold">{totals.sets}</p>
        </div>
        <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
          <p className="uppercase tracking-wide text-[10px] text-slate-500">Time Trained</p>
          <p className="mt-1 text-base font-semibold">{fmtMins(totals.time)}m</p>
        </div>
        <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
          <p className="uppercase tracking-wide text-[10px] text-slate-500">Best Volume Day</p>
          <p className="mt-1 text-base font-semibold">
            {bestVolumeDay
              ? `${new Date(bestVolumeDay.date).toLocaleDateString()} · ${Math.round(bestVolumeDay.volume)} kg`
              : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
          <p className="uppercase tracking-wide text-[10px] text-slate-500">Best Set</p>
          <p className="mt-1 text-base font-semibold">
            {bestSet
              ? `${getSetName(bestSet)} · ${getSetWeight(bestSet)} kg × ${bestSet.reps ?? 0}`
              : "—"}
          </p>
        </div>
      </div>

      {/* Streak */}
      <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
        <p className="uppercase tracking-wide text-[10px] text-slate-500">Current Streak</p>
        <p className="mt-1 text-base font-semibold">
          {streak} {streak === 1 ? "day" : "days"}
        </p>
      </div>

      {/* Last 7 days volume */}
      <div>
        <p className="text-xs font-semibold text-slate-300 mb-2">Volume · last 7 days</p>
        <div className="space-y-2">
          {last7.map((d) => {
            const pct = (d.volume / maxLast7) * 100;
            return (
              <div key={d.label} className="flex items-center gap-2">
                <span className="w-10 text-[11px] text-slate-400">{d.label}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-14 text-right text-[11px] text-slate-400">
                  {d.volume ? `${Math.round(d.volume)} kg` : "-"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
