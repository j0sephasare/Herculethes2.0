// src/pages/ChallengesPage.tsx

import { useMemo, useState } from "react";

type ChallengeExercise = {
  id: string;
  name: string;
  sets: string;
  repsOrTime: string;
  notes?: string;
};

type Challenge = {
  id: string;
  athleteName: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  focus: string;
  description: string;
  exercises: ChallengeExercise[];
};

// --- Challenge data ---------------------------------------------------------

const challenges: Challenge[] = [
  {
    id: "ronaldo-matchday",
    athleteName: "Cristiano Ronaldo",
    title: "Explosive Match-Day Workout",
    level: "Intermediate",
    duration: "45–60 min",
    focus: "Speed · Power · Core",
    description:
      "A football-style conditioning session inspired by how Ronaldo trains for explosiveness and match fitness. Focus on sharp sprints, powerful jumps and strong core control.",
    exercises: [
      {
        id: "ron-warmup-mobility",
        name: "Dynamic warm-up & mobility",
        sets: "1",
        repsOrTime: "8–10 min",
        notes: "Leg swings, hip circles, arm circles, light jogging."
      },
      {
        id: "ron-sprint-accels",
        name: "Sprint accelerations",
        sets: "5",
        repsOrTime: "20–30 m",
        notes: "Walk back to start as rest. Focus on powerful first 3–5 steps."
      },
      {
        id: "ron-bounding",
        name: "Lateral bounds (skater jumps)",
        sets: "3",
        repsOrTime: "12–16 total",
        notes: "Explosive side-to-side, stick the landing each rep."
      },
      {
        id: "ron-box-jumps",
        name: "Box / vertical jumps",
        sets: "3",
        repsOrTime: "8–10",
        notes: "Full extension, soft landing. Rest 60–90s between sets."
      },
      {
        id: "ron-bulgarian-split",
        name: "Bulgarian split squats",
        sets: "3",
        repsOrTime: "10–12 / leg",
        notes: "Bodyweight or light dumbbells. Control the tempo."
      },
      {
        id: "ron-pushups-core",
        name: "Push-ups + plank combo",
        sets: "3",
        repsOrTime: "12–15 push-ups → 30s plank",
        notes: "Minimal rest between push-ups and plank."
      },
      {
        id: "ron-core-finisher",
        name: "Ronaldo core finisher",
        sets: "2–3",
        repsOrTime: "30s each: V-ups · bicycle crunch · leg raises",
        notes: "Rest 30–45s between rounds."
      },
      {
        id: "ron-cooldown",
        name: "Cool-down & stretching",
        sets: "1",
        repsOrTime: "5–10 min",
        notes: "Hamstrings, hip flexors, quads, glutes, calves."
      }
    ]
  },
  {
    id: "messi-agility",
    athleteName: "Lionel Messi",
    title: "Agility & Dribbling Footwork",
    level: "Intermediate",
    duration: "35–45 min",
    focus: "Agility · Ball Control · Acceleration",
    description:
      "Change of direction, tight ball control and quick first steps. Use cones or markers if you have a ball, or run the patterns bodyweight-only.",
    exercises: [
      {
        id: "mes-warmup",
        name: "Light jog + dynamic warm-up",
        sets: "1",
        repsOrTime: "6–8 min",
        notes: "Include high knees, butt kicks, side shuffles."
      },
      {
        id: "mes-cone-slalom",
        name: "Cone slalom with ball",
        sets: "4",
        repsOrTime: "20–30 m",
        notes: "Tight touches, stay low. No ball? Just side-step through cones."
      },
      {
        id: "mes-5-10-5",
        name: "5–10–5 agility shuttle",
        sets: "4",
        repsOrTime: "5–10–5 m",
        notes: "Sprint, plant, explode the other way. Walk back as rest."
      },
      {
        id: "mes-ladder",
        name: "Quick-feet ladder drills",
        sets: "3",
        repsOrTime: "5 patterns",
        notes: "E.g. in-in-out, lateral in-in, hopscotch, icky shuffle."
      },
      {
        id: "mes-single-leg-balance",
        name: "Single-leg balance + reach",
        sets: "2",
        repsOrTime: "30–40s / leg",
        notes: "Reach in different directions, keep knee stable."
      },
      {
        id: "mes-core",
        name: "Anti-rotation core hold",
        sets: "3",
        repsOrTime: "20–30s / side",
        notes: "Cable/band Pallof press or side plank with reach."
      }
    ]
  },
  {
    id: "rookie-footballer",
    athleteName: "Rookie Footballer",
    title: "Beginner Full-Body Footballer",
    level: "Beginner",
    duration: "25–35 min",
    focus: "Base Strength · Conditioning",
    description:
      "Simple, no-equipment session for newer players. Focus on clean technique and gradually increasing reps over time.",
    exercises: [
      {
        id: "rookie-warmup",
        name: "Brisk walk / easy jog",
        sets: "1",
        repsOrTime: "5–7 min",
        notes: "Get warm but keep breathing comfortable."
      },
      {
        id: "rookie-squats",
        name: "Bodyweight squats",
        sets: "3",
        repsOrTime: "10–15",
        notes: "Feet shoulder-width, full control down and up."
      },
      {
        id: "rookie-hip-bridge",
        name: "Glute bridges",
        sets: "3",
        repsOrTime: "12–15",
        notes: "Squeeze glutes at the top, don’t over-arch lower back."
      },
      {
        id: "rookie-pushups",
        name: "Incline / knee push-ups",
        sets: "3",
        repsOrTime: "8–12",
        notes: "Use a bench, wall or knees to hit clean reps."
      },
      {
        id: "rookie-deadbug",
        name: "Dead bug core",
        sets: "3",
        repsOrTime: "8–10 / side",
        notes: "Lower opposite arm + leg with ribs pulled down."
      },
      {
        id: "rookie-cooldown",
        name: "Stretch & breathe",
        sets: "1",
        repsOrTime: "5 min",
        notes: "Hamstrings, quads, calves; slow nasal breathing."
      }
    ]
  }
];

// --- Component ---------------------------------------------------------------

type CompletedByChallenge = {
  [challengeId: string]: string[]; // array of completed exercise ids
};

export default function ChallengesPage() {
  const [selectedId, setSelectedId] = useState<string>(challenges[0].id);
  const [completedByChallenge, setCompletedByChallenge] =
    useState<CompletedByChallenge>({});

  const selectedChallenge = useMemo(
    () => challenges.find((c) => c.id === selectedId) ?? challenges[0],
    [selectedId]
  );

  const completedIds = completedByChallenge[selectedChallenge.id] ?? [];
  const total = selectedChallenge.exercises.length;
  const completedCount = selectedChallenge.exercises.filter((ex) =>
    completedIds.includes(ex.id)
  ).length;
  const allDone = total > 0 && completedCount === total;
  const progressPct = total ? Math.round((completedCount / total) * 100) : 0;

  const toggleExercise = (exerciseId: string) => {
    setCompletedByChallenge((prev) => {
      const prevForChallenge = prev[selectedChallenge.id] ?? [];
      const nextForChallenge = prevForChallenge.includes(exerciseId)
        ? prevForChallenge.filter((id) => id !== exerciseId)
        : [...prevForChallenge, exerciseId];

      return {
        ...prev,
        [selectedChallenge.id]: nextForChallenge
      };
    });
  };

  const resetChallenge = () => {
    setCompletedByChallenge((prev) => ({
      ...prev,
      [selectedChallenge.id]: []
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-4 pt-4 pb-3 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Challenges</h1>
        <p className="text-sm text-slate-400">
          Choose a challenge, then tick off each exercise to train like the
          pros.
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Challenge selector */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold tracking-wide text-slate-400">
            Pick a challenge
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {challenges.map((ch) => {
              const isActive = ch.id === selectedChallenge.id;
              const chCompletedIds = completedByChallenge[ch.id] ?? [];
              const chTotal = ch.exercises.length || 1;
              const chPct = Math.round(
                (chCompletedIds.length / chTotal) * 100
              );

              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedId(ch.id)}
                  className={`min-w-[210px] rounded-2xl border px-3 py-3 text-left text-xs transition ${
                    isActive
                      ? "border-blue-500/70 bg-blue-500/10"
                      : "border-slate-800 bg-slate-900/70 hover:border-slate-600"
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    {ch.athleteName}
                  </p>
                  <p className="text-sm font-semibold text-slate-50 line-clamp-2">
                    {ch.title}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {ch.level} · {ch.duration}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                      style={{ width: `${chPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {chPct}% complete
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected challenge details */}
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {selectedChallenge.athleteName}
              </p>
              <h2 className="text-lg font-semibold">
                {selectedChallenge.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Level:{" "}
                <span className="text-slate-200">
                  {selectedChallenge.level}
                </span>{" "}
                · Duration:{" "}
                <span className="text-slate-200">
                  {selectedChallenge.duration}
                </span>{" "}
                · Focus:{" "}
                <span className="text-slate-200">
                  {selectedChallenge.focus}
                </span>
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p className="font-semibold text-slate-200">
                {completedCount}/{total}
              </p>
              <p>done</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedChallenge.description}
          </p>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Reset button */}
          {completedCount > 0 && (
            <button
              type="button"
              onClick={resetChallenge}
              className="mt-1 text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2"
            >
              Reset this challenge
            </button>
          )}
        </section>

        {/* Exercise checklist */}
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">
            Workout checklist
          </h3>

          <div className="space-y-2">
            {selectedChallenge.exercises.map((ex, idx) => {
              const done = completedIds.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => toggleExercise(ex.id)}
                  className={`w-full text-left rounded-xl border px-3 py-2 flex items-start gap-3 text-xs transition ${
                    done
                      ? "border-emerald-500/60 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-950/40 hover:bg-slate-900/70"
                  }`}
                >
                  <div
                    className={`mt-0.5 w-4 h-4 flex items-center justify-center rounded-md border text-[10px] flex-shrink-0 ${
                      done
                        ? "border-emerald-400 bg-emerald-500 text-slate-950"
                        : "border-slate-600 text-slate-500"
                    }`}
                  >
                    {done && "✓"}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between gap-2">
                      <p
                        className={`font-semibold ${
                          done ? "text-emerald-300" : "text-slate-100"
                        }`}
                      >
                        {idx + 1}. {ex.name}
                      </p>
                      <p className="text-[11px] text-slate-400 whitespace-nowrap">
                        {ex.sets} sets · {ex.repsOrTime}
                      </p>
                    </div>
                    {ex.notes && (
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {ex.notes}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 mt-1">
            Tap an exercise to mark it complete. Tap again to undo.
          </p>
        </section>

        {/* Congrats banner */}
        {allDone && (
          <section className="rounded-2xl bg-emerald-500/10 border border-emerald-500/60 px-4 py-3 text-xs text-emerald-100 space-y-1">
            <p className="font-semibold">
              Training completed – you finished the{" "}
              {selectedChallenge.athleteName} challenge 💥
            </p>
            <p className="text-emerald-200/90">
              Great job! You can reset this challenge to run it again or switch
              to another athlete from the list above.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
