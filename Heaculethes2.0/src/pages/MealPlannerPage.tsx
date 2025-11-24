// src/pages/MealPlannerPage.tsx
import { useState } from "react";
type MealType = "breakfast" | "lunch" | "dinner";

type RecipeSummary = {
  id: number;
  title: string;
  image: string | null;
  readyInMinutes?: number;
  servings?: number;
};

type RecipeDetails = RecipeSummary & {
  summary?: string;
  instructions?: string;
  extendedIngredients?: { id: number; original: string }[];
};

type MealPlan = {
  breakfast: RecipeSummary | null;
  lunch: RecipeSummary | null;
  dinner: RecipeSummary | null;
};

const SPOONACULAR_BASE = "https://api.spoonacular.com";
const apiKey = import.meta.env.VITE_SPOONACULAR_API_KEY as string | undefined;

// same Olympus art used across pages
import OLYMPUS_BG_URL from "../assets/Olympus2.jpg";

export default function MealPlannerPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecipeSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [mealPlan, setMealPlan] = useState<MealPlan>({
    breakfast: null,
    lunch: null,
    dinner: null,
  });

  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // --- fetch helper ----------------------------------------------------------
  const fetchJson = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  // --- search ---------------------------------------------------------------
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (!apiKey) {
      setSearchError("Missing API key. Add VITE_SPOONACULAR_API_KEY to .env.local");
      return;
    }
    setSearchLoading(true);
    setSearchError(null);

    try {
      const url =
        `${SPOONACULAR_BASE}/recipes/complexSearch` +
        `?apiKey=${apiKey}` +
        `&query=${encodeURIComponent(query.trim())}` +
        `&number=15`;

      const data = await fetchJson(url);
      const results: RecipeSummary[] = (data.results || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        image: r.image ?? null,
        readyInMinutes: r.readyInMinutes,
        servings: r.servings,
      }));
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      setSearchError("Failed to search recipes. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  // --- details --------------------------------------------------------------
  const loadRecipeDetails = async (id: number) => {
    if (!apiKey) {
      setDetailsError("Missing API key. Add VITE_SPOONACULAR_API_KEY to .env.local");
      return;
    }
    setDetailsLoading(true);
    setDetailsError(null);

    try {
      const url = `${SPOONACULAR_BASE}/recipes/${id}/information?apiKey=${apiKey}&includeNutrition=false`;
      const data = await fetchJson(url);

      const recipe: RecipeDetails = {
        id: data.id,
        title: data.title,
        image: data.image ?? null,
        readyInMinutes: data.readyInMinutes,
        servings: data.servings,
        summary: data.summary,
        instructions: data.instructions,
        extendedIngredients: data.extendedIngredients?.map((ing: any) => ({
          id: ing.id ?? Math.random(),
          original: ing.original,
        })),
      };
      setSelectedRecipe(recipe);
    } catch (err) {
      console.error(err);
      setDetailsError("Failed to load recipe details. Please try again.");
    } finally {
      setDetailsLoading(false);
    }
  };

  // --- assign ---------------------------------------------------------------
  const handleAssignMeal = (meal: MealType, recipe: RecipeSummary) => {
    setMealPlan((prev) => ({ ...prev, [meal]: recipe }));
    loadRecipeDetails(recipe.id);
  };

  // --- select from plan -----------------------------------------------------
  const handleSelectFromPlan = (meal: MealType) => {
    const recipe = mealPlan[meal];
    if (!recipe) return;
    if (selectedRecipe?.id === recipe.id) return;
    loadRecipeDetails(recipe.id);
  };

  // --- render helpers -------------------------------------------------------
  const renderSummaryText = (recipe: RecipeSummary) => {
    const parts: string[] = [];
    if (recipe.readyInMinutes) parts.push(`${recipe.readyInMinutes} min`);
    if (recipe.servings) parts.push(`${recipe.servings} servings`);
    return parts.join(" • ");
  };

  const renderHtml = (html?: string) =>
    html ? (
      <p
        className="text-xs leading-relaxed text-slate-200"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    ) : null;

  // --- JSX ------------------------------------------------------------------
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
              Meal Planner
            </h1>
            <p className="mt-1 text-xs sm:text-sm tracking-wide uppercase text-yellow-200/80">
              Build your breakfast • lunch • dinner plan
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Search */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes (e.g. chicken, pasta, oats)…"
              className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-yellow-400/60"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-900 font-medium text-sm hover:from-yellow-400 hover:to-amber-300 disabled:opacity-60 shadow-[0_8px_24px_rgba(234,179,8,0.25)]"
            >
              {searchLoading ? "Searching…" : "Search"}
            </button>
          </div>
          {searchError && <p className="text-xs text-red-300">{searchError}</p>}
        </form>

        {/* Search results */}
        {searchResults.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-200/80">
              Results
            </h2>
            <div className="space-y-3">
              {searchResults.map((recipe) => (
                <article
                  key={`search-${recipe.id}`}
                  className="flex gap-3 rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-3 hover:border-yellow-400/35 transition"
                >
                  {recipe.image && (
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{recipe.title}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {renderSummaryText(recipe) || "Recipe"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAssignMeal("breakfast", recipe)}
                        className="text-[11px] px-2 py-1 rounded-full border border-slate-700 hover:border-yellow-400/60"
                      >
                        Use as breakfast
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignMeal("lunch", recipe)}
                        className="text-[11px] px-2 py-1 rounded-full border border-slate-700 hover:border-yellow-400/60"
                      >
                        Use as lunch
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignMeal("dinner", recipe)}
                        className="text-[11px] px-2 py-1 rounded-full border border-slate-700 hover:border-yellow-400/60"
                      >
                        Use as dinner
                      </button>
                      <button
                        type="button"
                        onClick={() => loadRecipeDetails(recipe.id)}
                        className="text-[11px] px-2 py-1 rounded-full border border-slate-700 hover:border-yellow-400/60"
                      >
                        View recipe
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Today's plan */}
        <section className="rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 overflow-hidden">
          <div className="border-b border-yellow-400/20 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-200/90">
              Today&apos;s Plan
            </h2>
            <p className="text-[11px] text-slate-400">
              Tap a row to open the recipe details below.
            </p>
          </div>

          {(["breakfast", "lunch", "dinner"] as MealType[]).map((meal) => {
            const recipe = mealPlan[meal];
            const label = meal.toUpperCase();
            return (
              <button
                key={`plan-${meal}`}
                type="button"
                onClick={() => handleSelectFromPlan(meal)}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-xs border-t border-yellow-400/10 hover:bg-slate-800/60 disabled:opacity-60"
                disabled={!recipe}
              >
                <span className="font-semibold text-yellow-200/80 min-w-[88px]">
                  {label}
                </span>
                <span className="flex-1 text-slate-100 truncate pl-2">
                  {recipe ? recipe.title : "Not selected"}
                </span>
                {recipe && <span className="text-[11px] text-yellow-300 pl-2">View →</span>}
              </button>
            );
          })}
        </section>

        {/* Recipe details */}
        <section className="rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-200/90">
            Recipe Details
          </h2>

          {detailsLoading && <p className="text-xs text-slate-400">Loading recipe…</p>}
          {detailsError && <p className="text-xs text-red-300">{detailsError}</p>}

          {!detailsLoading && !selectedRecipe && !detailsError && (
            <p className="text-xs text-slate-400">
              Select a recipe above to see ingredients and instructions.
            </p>
          )}

          {selectedRecipe && !detailsLoading && (
            <>
              <div className="flex gap-3">
                {selectedRecipe.image && (
                  <img
                    src={selectedRecipe.image}
                    alt={selectedRecipe.title}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{selectedRecipe.title}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {renderSummaryText(selectedRecipe)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {renderHtml(selectedRecipe.summary)}

                {selectedRecipe.extendedIngredients?.length ? (
                  <div className="mt-2">
                    <p className="text-xs font-semibold mb-1">Ingredients</p>
                    <ul className="text-[11px] text-slate-200 space-y-1">
                      {selectedRecipe.extendedIngredients.map((ing, idx) => (
                        <li key={`ing-${ing.id}-${idx}`}>{ing.original}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {selectedRecipe.instructions && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold mb-1">Instructions</p>
                    {renderHtml(selectedRecipe.instructions)}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
