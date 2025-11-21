// src/pages/ChallengesPage.tsx
import { useMemo, useState, type CSSProperties } from "react";
import ronaldoImg from "../assets/ronaldo-training.jpg";

type Exercise = {
  id: string;
  title: string;
  description: string;
  setsReps: string;
};

type Challenge = {
  id: string;
  athlete: string;
  name: string;
  level: string;
  duration: string;
  focus: string;
  description: string;
  image?: string;
  checklist: Exercise[];
};

const CHALLENGES: Challenge[] = [
  {
    id: "ronaldo-matchday",
    athlete: "Cristiano Ronaldo",
    name: "Explosive Match-Day Workout",
    level: "Intermediate",
    duration: "45–60 min",
    focus: "Speed · Power · Core",
    description:
      "A football-style conditioning session inspired by how Ronaldo trains for explosiveness and match fitness. Focus on sharp sprints, powerful jumps and strong core control.",
    image: ronaldoImg,
    checklist: [
      { id: "ron-1", title: "Dynamic warm-up & mobility", description: "Leg swings, hip circles, arm circles, light jogging.", setsReps: "1 set · 8–10 min" },
      { id: "ron-2", title: "Sprint accelerations", description: "Walk back to start as rest. Focus on powerful first 3–5 steps.", setsReps: "5 sets · 20–30 m" },
      { id: "ron-3", title: "Lateral bounds (skater jumps)", description: "Explosive side-to-side, stick the landing each rep.", setsReps: "3 sets · 12–16 total" },
      { id: "ron-4", title: "Box / vertical jumps", description: "Full extension, soft landing. Rest 60–90s between sets.", setsReps: "3 sets · 8–10" },
      { id: "ron-5", title: "Bulgarian split squats", description: "Bodyweight or light dumbbells. Control the tempo.", setsReps: "3 sets · 10–12 / leg" },
      { id: "ron-6", title: "Push-ups + plank combo", description: "Minimal rest between push-ups and plank.", setsReps: "3 sets · 12–15 push-ups → 30s plank" },
      { id: "ron-7", title: "Ronaldo core finisher", description: "Rest 30–45s between rounds.", setsReps: "2–3 sets · 30s each: V-ups · bicycle crunch · leg raises" },
      { id: "ron-8", title: "Cool-down & stretching", description: "Hamstrings, hip flexors, quads, glutes, calves.", setsReps: "1 set · 5–10 min" },
    ],
  },
  {
    id: "messi-agility",
    athlete: "Lionel Messi",
    name: "Agility & Dribbling Footwork",
    level: "Intermediate",
    duration: "35–45 min",
    focus: "Agility · Ball control",
    description: "Short, sharp footwork and dribbling drills to sharpen your first touch and change of direction.",
    checklist: [
      { id: "mes-1", title: "Cone slalom dribbles", description: "Keep the ball close, use both feet.", setsReps: "4–5 runs" },
      { id: "mes-2", title: "T-shuttle change-of-direction", description: "Forward, lateral and backpedal sprints.", setsReps: "4–6 reps" },
    ],
  },
  {
    id: "rookie-fullbody",
    athlete: "Rookie Footballer",
    name: "Beginner Full-Body Footballer",
    level: "Beginner",
    duration: "25–35 min",
    focus: "Basics · Conditioning",
    description: "Simple full-body routine to build a foundation for football: basic strength, cardio and movement patterns.",
    checklist: [
      { id: "roo-1", title: "Light jog or bike", description: "Raise heart rate gradually.", setsReps: "5–8 min" },
      { id: "roo-2", title: "Bodyweight squats", description: "Comfortable depth, smooth tempo.", setsReps: "3 sets · 10–12" },
    ],
  },
];

export default function ChallengesPage() {
  const [selectedChallengeId, setSelectedChallengeId] = useState(CHALLENGES[0].id);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const selectedChallenge = useMemo(
    () => CHALLENGES.find((c) => c.id === selectedChallengeId)!,
    [selectedChallengeId]
  );

  const completedCount = selectedChallenge.checklist.filter((ex) => completed[ex.id]).length;
  const totalCount = selectedChallenge.checklist.length;
  const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleExercise = (id: string) =>
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));

  // FIX #1 — Full-bleed hero image with proper positioning
  const heroStyle: CSSProperties = selectedChallenge.image
    ? {
        backgroundImage: `url(${selectedChallenge.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        minHeight: "260px", // ensures Ronaldo's face is visible
      }
    : {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-4 pt-4 pb-3 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Challenges</h1>
        <p className="text-sm text-slate-400">Choose a challenge and train like the pros.</p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Challenge picker */}
        <section className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase">Pick a challenge</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CHALLENGES.map((challenge) => {
              const isActive = challenge.id === selectedChallengeId;
              const challengeCompletedCount = challenge.checklist.filter((ex) => completed[ex.id]).length;
              const challengePct = Math.round((challengeCompletedCount / challenge.checklist.length) * 100);

              return (
                <button
                  key={challenge.id}
                  onClick={() => setSelectedChallengeId(challenge.id)}
                  className={`text-left rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? "border-blue-500/70 bg-blue-500/10"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                  }`}
                >
                  <p className="text-[11px] uppercase text-slate-400">{challenge.athlete}</p>
                  <p className="mt-1 text-sm font-semibold">{challenge.name}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{challenge.level} · {challenge.duration}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{challengePct}% complete</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Hero Section with Full Background */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">

          {/* HERO IMAGE WITH DARK GRADIENT */}
          <div className="relative w-full" style={heroStyle}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-slate-950/95" />

            <div className="relative p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-blue-300 font-semibold">
                    {selectedChallenge.athlete}
                  </p>
                  <h2 className="text-xl font-bold text-white drop-shadow">
                    {selectedChallenge.name}
                  </h2>
                </div>

                <div className="text-right text-[11px] text-slate-200">
                  <p>{completedCount}/{totalCount} done</p>
                  <p className="mt-0.5">Level: <span className="font-semibold">{selectedChallenge.level}</span></p>
                </div>
              </div>

              <p className="text-xs text-slate-200">
                <span className="font-semibold">Duration:</span> {selectedChallenge.duration} ·{" "}
                <span className="font-semibold">Focus:</span> {selectedChallenge.focus}
              </p>

              <p className="text-sm text-slate-100 max-w-2xl drop-shadow">
                {selectedChallenge.description}
              </p>

              <div className="space-y-1 pt-2 max-w-md">
                <p className="text-[11px] text-slate-200">Progress</p>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-200">{progressPct}% complete</p>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="px-5 pb-4 pt-3">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
              Workout checklist
            </p>

            <div className="space-y-2">
              {selectedChallenge.checklist.map((exercise) => {
                const isDone = !!completed[exercise.id];
                return (
                  <button
                    key={exercise.id}
                    onClick={() => toggleExercise(exercise.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left text-xs flex items-start gap-3 transition ${
                      isDone ? "border-emerald-500/70 bg-emerald-500/10" : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                    }`}
                  >
                    <div className="mt-[2px]">
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          isDone ? "border-emerald-400 bg-emerald-500" : "border-slate-500"
                        }`}
                      >
                        {isDone && <span className="text-[10px] text-slate-950">✓</span>}
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-[13px]">{exercise.title}</p>
                      <p className="text-[11px] text-slate-400">{exercise.description}</p>
                    </div>

                    <p className="text-[11px] text-slate-400 whitespace-nowrap">
                      {exercise.setsReps}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
