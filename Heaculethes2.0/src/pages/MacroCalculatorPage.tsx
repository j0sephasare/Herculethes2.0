// src/pages/MacroCalculatorPage.tsx
import { useMemo, useState } from "react";

type Sex = "male" | "female";
type Goal = "lose" | "maintain" | "gain";
type ActivityLevel = "sedentary" | "light" | "moderate" | "high" | "athlete";

type Result = {
  calories: number;
  protein: number; // g
  fat: number; // g
  carbs: number; // g
};

function round(n: number) {
  return Math.round(n);
}

export default function MacroCalculatorPage() {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState<string>("25");
  const [height, setHeight] = useState<string>("180"); // cm
  const [weight, setWeight] = useState<string>("80"); // kg
  const [goal, setGoal] = useState<Goal>("maintain");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");

  // Protein per-kg preset (lets you nudge from 1.6–2.2 g/kg)
  const [proteinPerKg, setProteinPerKg] = useState<number>(2.0);

  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activityFactor: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    high: 1.725,
    athlete: 1.9,
  };

  const handleCalculate = () => {
    setError(null);
    setCopied(false);

    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);

    if (!ageNum || !heightNum || !weightNum) {
      setError("Please enter a valid age, height and weight.");
      setResult(null);
      return;
    }

    if (proteinPerKg < 1 || proteinPerKg > 3) {
      setError("Protein per kg should be between 1.0 and 3.0.");
      setResult(null);
      return;
    }

    // 1) BMR – Mifflin-St Jeor
    let bmr =
      10 * weightNum + 6.25 * heightNum - 5 * ageNum + (sex === "male" ? 5 : -161);

    // 2) Activity multiplier
    let tdee = bmr * activityFactor[activity];

    // 3) Goal adjustment
    if (goal === "lose") tdee -= 500; // ~0.5 kg / week
    if (goal === "gain") tdee += 300; // lean bulk
    if (tdee < bmr) tdee = bmr; // don't go below BMR

    const calories = Math.round(tdee);

    // 4) Macros
    const protein = weightNum * proteinPerKg; // g
    const fat = weightNum * 0.8; // g baseline
    const proteinCals = protein * 4;
    const fatCals = fat * 9;

    let carbCals = calories - (proteinCals + fatCals);
    if (carbCals < 0) carbCals = 0;
    const carbs = carbCals / 4;

    setResult({
      calories: round(calories),
      protein: round(protein),
      fat: round(fat),
      carbs: round(carbs),
    });
  };

  const resetAll = () => {
    setSex("male");
    setAge("25");
    setHeight("180");
    setWeight("80");
    setGoal("maintain");
    setActivity("moderate");
    setProteinPerKg(2.0);
    setResult(null);
    setError(null);
    setCopied(false);
  };

  const macroPercents = useMemo(() => {
    if (!result) return { p: 0, f: 0, c: 0 };
    const pCal = result.protein * 4;
    const fCal = result.fat * 9;
    const cCal = result.carbs * 4;
    const total = Math.max(pCal + fCal + cCal, 1);
    return {
      p: Math.round((pCal / total) * 100),
      f: Math.round((fCal / total) * 100),
      c: Math.round((cCal / total) * 100),
    };
  }, [result]);

  const copyToClipboard = async () => {
    if (!result) return;
    const text = `Daily Target
Calories: ${result.calories} kcal
Protein: ${result.protein} g
Fat: ${result.fat} g
Carbs: ${result.carbs} g`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-4 pt-5 pb-4 border-b border-yellow-400/20 bg-slate-950/90">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-400/20 border border-yellow-400/30 flex items-center justify-center text-lg">
            ⚖️
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Macro calculator
            </h1>
            <p className="text-sm text-slate-400">
              Estimate daily calories and macros—Olympus style.
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

        {/* Inputs */}
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-4 text-sm">
          {/* Sex & age */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Sex</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSex("male")}
                  className={`rounded-md border px-2 py-1 ${
                    sex === "male"
                      ? "border-yellow-400/60 bg-yellow-500/15"
                      : "border-slate-700 bg-slate-950/40 hover:border-slate-600"
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setSex("female")}
                  className={`rounded-md border px-2 py-1 ${
                    sex === "female"
                      ? "border-yellow-400/60 bg-yellow-500/15"
                      : "border-slate-700 bg-slate-950/40 hover:border-slate-600"
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Age (years)</label>
              <input
                type="number"
                min={10}
                max={90}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-md bg-slate-950/40 border border-slate-700 px-2 py-1 outline-none focus:border-yellow-400/60"
              />
            </div>
          </div>

          {/* Height & weight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Height (cm)</label>
              <input
                type="number"
                min={120}
                max={230}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full rounded-md bg-slate-950/40 border border-slate-700 px-2 py-1 outline-none focus:border-yellow-400/60"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Weight (kg)</label>
              <input
                type="number"
                min={35}
                max={250}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-md bg-slate-950/40 border border-slate-700 px-2 py-1 outline-none focus:border-yellow-400/60"
              />
            </div>
          </div>

          {/* Activity */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Activity level</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              className="w-full rounded-md bg-slate-950/40 border border-slate-700 px-2 py-1 outline-none focus:border-yellow-400/60"
            >
              <option value="sedentary">Sedentary (desk job, little exercise)</option>
              <option value="light">Light (1–3 workouts/week)</option>
              <option value="moderate">Moderate (3–5 workouts/week)</option>
              <option value="high">High (6–7 workouts/week)</option>
              <option value="athlete">Athlete (2x/day, very physical)</option>
            </select>
          </div>

          {/* Goal */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Goal</label>
            <div className="grid grid-cols-3 gap-2">
              {(["lose", "maintain", "gain"] as Goal[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    goal === g
                      ? "border-yellow-400/60 bg-yellow-500/15"
                      : "border-slate-700 bg-slate-950/40 hover:border-slate-600"
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Protein preset */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">
              Protein target (g/kg)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1.6, 1.8, 2.0, 2.2].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProteinPerKg(p)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    proteinPerKg === p
                      ? "border-yellow-400/60 bg-yellow-500/15"
                      : "border-slate-700 bg-slate-950/40 hover:border-slate-600"
                  }`}
                >
                  {p} g/kg
                </button>
              ))}
            </div>
            <input
              type="number"
              step={0.1}
              min={1.0}
              max={3.0}
              value={proteinPerKg}
              onChange={(e) => setProteinPerKg(Number(e.target.value))}
              className="mt-2 w-full rounded-md bg-slate-950/40 border border-slate-700 px-2 py-1 outline-none focus:border-yellow-400/60"
            />
            <p className="text-[11px] text-slate-500">
              Tip: 1.6–2.2 g/kg works well for most lifters. You chose{" "}
              <span className="text-yellow-300 font-semibold">{proteinPerKg.toFixed(1)} g/kg</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCalculate}
              className="w-full rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-slate-950 py-2 text-sm font-extrabold tracking-wide"
            >
              Calculate macros
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="w-full rounded-xl border border-slate-700 hover:border-slate-600 py-2 text-sm"
            >
              Reset
            </button>
          </div>
        </section>

        {/* Results */}
        {result && (
          <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Daily target</h2>
              <button
                onClick={copyToClipboard}
                className="text-[11px] rounded-md border border-yellow-400/40 px-2 py-1 hover:bg-yellow-500/10"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
                <p className="uppercase tracking-wide text-[10px] text-slate-500">
                  Calories
                </p>
                <p className="mt-1 text-base font-semibold">
                  {result.calories} kcal
                </p>
              </div>
              <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
                <p className="uppercase tracking-wide text-[10px] text-slate-500">
                  Protein
                </p>
                <p className="mt-1 text-base font-semibold">
                  {result.protein} g
                </p>
              </div>
              <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
                <p className="uppercase tracking-wide text-[10px] text-slate-500">
                  Fat
                </p>
                <p className="mt-1 text-base font-semibold">
                  {result.fat} g
                </p>
              </div>
              <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
                <p className="uppercase tracking-wide text-[10px] text-slate-500">
                  Carbs
                </p>
                <p className="mt-1 text-base font-semibold">
                  {result.carbs} g
                </p>
              </div>
            </div>

            {/* Macro % bars */}
            <div className="space-y-2">
              <p className="text-[11px] text-slate-400">Macro distribution (by calories)</p>
              <div className="h-3 w-full rounded-full overflow-hidden border border-slate-800 bg-slate-950">
                <div
                  className="h-full bg-yellow-500/90"
                  style={{ width: `${macroPercents.p}%` }}
                  title={`Protein ${macroPercents.p}%`}
                />
                <div
                  className="h-full bg-amber-300/90"
                  style={{ width: `${macroPercents.f}%` }}
                  title={`Fat ${macroPercents.f}%`}
                />
                <div
                  className="h-full bg-emerald-400/90"
                  style={{ width: `${macroPercents.c}%` }}
                  title={`Carbs ${macroPercents.c}%`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>Protein {macroPercents.p}%</span>
                <span>Fat {macroPercents.f}%</span>
                <span>Carbs {macroPercents.c}%</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              These numbers are an estimate. Track for 2–3 weeks and adjust by
              ~150–250 kcal depending on progress.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
