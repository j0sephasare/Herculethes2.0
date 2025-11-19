// src/pages/MacroCalculatorPage.tsx
import { useState } from "react";

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
  const [result, setResult] = useState<Result | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null);

    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);

    if (!ageNum || !heightNum || !weightNum) {
      setError("Please enter a valid age, height and weight.");
      setResult(null);
      return;
    }

    // 1) BMR – Mifflin-St Jeor
    let bmr =
      10 * weightNum + 6.25 * heightNum - 5 * ageNum + (sex === "male" ? 5 : -161);

    // 2) Activity multiplier
    const activityFactor: Record<ActivityLevel, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      high: 1.725,
      athlete: 1.9,
    };

    let tdee = bmr * activityFactor[activity];

    // 3) Goal adjustment
    if (goal === "lose") {
      tdee -= 500; // approx -0.5 kg/week
    } else if (goal === "gain") {
      tdee += 300; // lean bulk
    }
    if (tdee < bmr) tdee = bmr; // don't go below BMR

    const calories = Math.round(tdee);

    // 4) Macros
    // Protein: 2 g/kg, Fat: 0.8 g/kg, rest = carbs
    const protein = weightNum * 2; // g
    const fat = weightNum * 0.8; // g

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-4 pt-4 pb-3 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Macro calculator</h1>
        <p className="text-sm text-slate-400">
          Estimate your daily calories and macros based on your goal.
        </p>
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSex("male")}
                  className={`flex-1 rounded-md border px-2 py-1 ${
                    sex === "male"
                      ? "border-blue-500 bg-blue-600/20"
                      : "border-slate-700 bg-slate-950/40"
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setSex("female")}
                  className={`flex-1 rounded-md border px-2 py-1 ${
                    sex === "female"
                      ? "border-blue-500 bg-blue-600/20"
                      : "border-slate-700 bg-slate-950/40"
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
                className="w-full rounded-md bg-slate-950/40 border border-slate-700 px-2 py-1 outline-none focus:border-blue-500"
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
                className="w-full rounded-md bg-slate-950/40 border border-slate-700 px-2 py-1 outline-none focus:border-blue-500"
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
                className="w-full rounded-md bg-slate-950/40 border border-slate-700 px-2 py-1 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Activity */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Activity level</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              className="w-full rounded-md bg-slate-950/40 border border-slate-700 px-2 py-1 outline-none focus:border-blue-500"
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
              <button
                type="button"
                onClick={() => setGoal("lose")}
                className={`rounded-md border px-2 py-1 text-xs ${
                  goal === "lose"
                    ? "border-blue-500 bg-blue-600/20"
                    : "border-slate-700 bg-slate-950/40"
                }`}
              >
                Lose
              </button>
              <button
                type="button"
                onClick={() => setGoal("maintain")}
                className={`rounded-md border px-2 py-1 text-xs ${
                  goal === "maintain"
                    ? "border-blue-500 bg-blue-600/20"
                    : "border-slate-700 bg-slate-950/40"
                }`}
              >
                Maintain
              </button>
              <button
                type="button"
                onClick={() => setGoal("gain")}
                className={`rounded-md border px-2 py-1 text-xs ${
                  goal === "gain"
                    ? "border-blue-500 bg-blue-600/20"
                    : "border-slate-700 bg-slate-950/40"
                }`}
              >
                Gain
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCalculate}
            className="w-full mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2 text-sm font-semibold"
          >
            Calculate macros
          </button>
        </section>

        {/* Results */}
        {result && (
          <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3 text-sm">
            <h2 className="text-sm font-semibold text-slate-200">
              Daily target
            </h2>
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
            <p className="text-[11px] text-slate-400">
              These numbers are an estimate. You can adjust them based on how
              your body responds over a few weeks.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
