import { useEffect, useState } from "react";

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

const apiKey = import.meta.env.VITE_SPOONACULAR_API_KEY as
  | string
  | undefined;

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

  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(
    null
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // --- basic fetch helpers ---------------------------------------------------

  const fetchJson = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  };

  // --- search for recipes ----------------------------------------------------

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

      const results: RecipeSummary[] = (data.results || []).map(
        (r: any): RecipeSummary => ({
          id: r.id,
          title: r.title,
          image: r.image ?? null,
          readyInMinutes: r.readyInMinutes,
          servings: r.servings,
        })
      );

      setSearchResults(results);
    } catch (err: any) {
      console.error(err);
      setSearchError("Failed to search recipes. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  // --- get full details for a recipe ----------------------------------------

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
    } catch (err: any) {
      console.error(err);
      setDetailsError("Failed to load recipe details. Please try again.");
    } finally {
      setDetailsLoading(false);
    }
  };

  // --- assign a recipe to a meal ---------------------------------------------

  const handleAssignMeal = (meal: MealType, recipe: RecipeSummary) => {
    setMealPlan((prev) => ({
      ...prev,
      [meal]: recipe,
    }));
    // also load details for the newly chosen meal
    loadRecipeDetails(recipe.id);
  };

  // --- clicking today's plan rows -------------------------------------------

  const handleSelectFromPlan = (meal: MealType) => {
    const recipe = mealPlan[meal];
    if (!recipe) return;

    // if we already have details for this recipe, just show them
    if (selectedRecipe && selectedRecipe.id === recipe.id) {
      return;
    }

    loadRecipeDetails(recipe.id);
  };

  // --- render helpers --------------------------------------------------------

  const renderSummaryText = (recipe: RecipeSummary) => {
    const parts: string[] = [];
    if (recipe.readyInMinutes) parts.push(`${recipe.readyInMinutes} min`);
    if (recipe.servings) parts.push(`${recipe.servings} servings`);
    return parts.join(" • ");
  };

  const renderHtml = (html?: string) => {
    if (!html) return null;
    return (
      <p
        className="text-xs leading-relaxed text-slate-200"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  // --- JSX -------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-4 pt-4 pb-3 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Meal planner</h1>
        <p className="text-sm text-slate-400">
          Search for recipes and build a simple breakfast / lunch / dinner plan.
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Search form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes (e.g. chicken, pasta, oats)…"
              className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
            >
              {searchLoading ? "Searching…" : "Search"}
            </button>
          </div>
          {searchError && (
            <p className="text-xs text-red-300">{searchError}</p>
          )}
        </form>

        {/* Search results */}
        {searchResults.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-200">
              Results
            </h2>
            <div className="space-y-3">
              {searchResults.map((recipe) => (
                <article
                  key={`search-${recipe.id}`} // UNIQUE KEY
                  className="flex gap-3 rounded-2xl bg-slate-900/80 border border-slate-800 p-3"
                >
                  {recipe.image && (
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {recipe.title}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {renderSummaryText(recipe) || "Recipe"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAssignMeal("breakfast", recipe)}
                        className="text-[11px] px-2 py-1 rounded-full border border-slate-700 hover:border-blue-500"
                      >
                        Use as breakfast
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignMeal("lunch", recipe)}
                        className="text-[11px] px-2 py-1 rounded-full border border-slate-700 hover:border-blue-500"
                      >
                        Use as lunch
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignMeal("dinner", recipe)}
                        className="text-[11px] px-2 py-1 rounded-full border border-slate-700 hover:border-blue-500"
                      >
                        Use as dinner
                      </button>
                      <button
                        type="button"
                        onClick={() => loadRecipeDetails(recipe.id)}
                        className="text-[11px] px-2 py-1 rounded-full border border-slate-700 hover:border-blue-500"
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
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold">Today&apos;s plan</h2>
            <p className="text-[11px] text-slate-400">
              Tap a row to open the recipe details below.
            </p>
          </div>

          {(["breakfast", "lunch", "dinner"] as MealType[]).map((meal) => {
            const recipe = mealPlan[meal];
            const label =
              meal === "breakfast"
                ? "BREAKFAST"
                : meal === "lunch"
                ? "LUNCH"
                : "DINNER";

            return (
              <button
                key={`plan-${meal}`} // UNIQUE KEY (no duplicate id issue)
                type="button"
                onClick={() => handleSelectFromPlan(meal)}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-xs border-t border-slate-800 hover:bg-slate-800/60 disabled:opacity-60"
                disabled={!recipe}
              >
                <span className="font-semibold text-slate-400 min-w-[80px]">
                  {label}
                </span>
                <span className="flex-1 text-slate-100 truncate pl-2">
                  {recipe ? recipe.title : "Not selected"}
                </span>
                {recipe && (
                  <span className="text-[11px] text-blue-400 pl-2">
                    View →
                  </span>
                )}
              </button>
            );
          })}
        </section>

        {/* Recipe details */}
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
          <h2 className="text-sm font-semibold">Recipe details</h2>

          {detailsLoading && (
            <p className="text-xs text-slate-400">Loading recipe…</p>
          )}
          {detailsError && (
            <p className="text-xs text-red-300">{detailsError}</p>
          )}

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
                  <p className="text-sm font-semibold">
                    {selectedRecipe.title}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {renderSummaryText(selectedRecipe)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {renderHtml(selectedRecipe.summary)}

                {selectedRecipe.extendedIngredients &&
                  selectedRecipe.extendedIngredients.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-1">
                        Ingredients
                      </p>
                      <ul className="text-[11px] text-slate-200 space-y-1">
                        {selectedRecipe.extendedIngredients.map((ing, idx) => (
                          <li key={`ing-${ing.id}-${idx}`}>
                            {ing.original}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {selectedRecipe.instructions && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold mb-1">
                      Instructions
                    </p>
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
