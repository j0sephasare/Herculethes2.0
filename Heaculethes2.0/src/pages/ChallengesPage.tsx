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

  // Hero image style 
  const heroStyle: CSSProperties = selectedChallenge.image
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(2,6,23,0.85)), url(${selectedChallenge.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        minHeight: "260px",
      }
    : {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Olympus header */}
      <header className="relative border-b border-slate-800">
        <div className="px-4 py-6 sm:py-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-300 shadow-[0_0_0_2px_rgba(234,179,8,0.35),0_10px_40px_rgba(234,179,8,0.2)] flex items-center justify-center">
              <span className="text-xl text-slate-900">Λ</span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400">
              Challenges
            </h1>
            <p className="mt-1 text-xs sm:text-sm tracking-wide uppercase text-yellow-200/80">
              Choose a challenge and train like the pros
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Challenge picker */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-yellow-200/80">
            Pick a Challenge
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CHALLENGES.map((challenge) => {
              const isActive = challenge.id === selectedChallengeId;
              const challengeCompletedCount = challenge.checklist.filter((ex) => completed[ex.id]).length;
              const challengePct = Math.round((challengeCompletedCount / challenge.checklist.length) * 100);

              return (
                <button
                  key={challenge.id}
                  onClick={() => setSelectedChallengeId(challenge.id)}
                  className={`text-left rounded-2xl p-4 transition bg-slate-900/70 backdrop-blur border ${
                    isActive
                      ? "border-yellow-400/40 shadow-[0_0_0_1px_rgba(234,179,8,0.25)]"
                      : "border-yellow-400/20 hover:border-yellow-400/35"
                  }`}
                >
                  <p className="text-[11px] uppercase text-yellow-200/80">{challenge.athlete}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{challenge.name}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {challenge.level} · {challenge.duration}
                  </p>
                  <p className="mt-2 text-[11px] text-yellow-300">{challengePct}% complete</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected challenge card */}
        <section className="rounded-2xl border border-yellow-400/20 bg-slate-900/70 backdrop-blur overflow-hidden">
          {/* Hero */}
          <div className="relative w-full" style={heroStyle}>
            <div className="relative p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-yellow-200/80 font-semibold">
                    {selectedChallenge.athlete}
                  </p>
                  <h2 className="text-xl font-bold text-white drop-shadow">
                    {selectedChallenge.name}
                  </h2>
                </div>

                <div className="text-right text-[11px] text-slate-100">
                  <p>
                    {completedCount}/{totalCount} done
                  </p>
                  <p className="mt-0.5">
                    Level: <span className="font-semibold">{selectedChallenge.level}</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-100">
                <span className="font-semibold">Duration:</span> {selectedChallenge.duration} ·{" "}
                <span className="font-semibold">Focus:</span> {selectedChallenge.focus}
              </p>

              <p className="text-sm text-slate-50 max-w-2xl drop-shadow">
                {selectedChallenge.description}
              </p>

              <div className="space-y-1 pt-2 max-w-md">
                <p className="text-[11px] text-yellow-200/80">Progress</p>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-200">{progressPct}% complete</p>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="px-5 pb-4 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-yellow-200/80 mb-2">
              Workout Checklist
            </p>

            <div className="space-y-2">
              {selectedChallenge.checklist.map((exercise) => {
                const isDone = !!completed[exercise.id];
                return (
                  <button
                    key={exercise.id}
                    onClick={() => toggleExercise(exercise.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left text-xs flex items-start gap-3 transition ${
                      isDone
                        ? "border-emerald-500/70 bg-emerald-500/10"
                        : "border-yellow-400/20 bg-slate-900/70 hover:border-yellow-400/35"
                    }`}
                  >
                    <div className="mt-[2px]">
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          isDone ? "border-emerald-400 bg-emerald-500" : "border-slate-500"
                        }`}
                        aria-checked={isDone}
                        role="checkbox"
                      >
                        {isDone && <span className="text-[10px] text-slate-950">✓</span>}
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-[13px] text-slate-100">{exercise.title}</p>
                      <p className="text-[11px] text-slate-400">{exercise.description}</p>
                    </div>

                    <p className="text-[11px] text-slate-400 whitespace-nowrap">{exercise.setsReps}</p>
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
