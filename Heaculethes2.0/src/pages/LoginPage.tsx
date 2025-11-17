// src/pages/LoginPage.tsx
import { type FormEvent, useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-1 text-center">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="text-sm text-slate-400 mb-4 text-center">
          Sign in to continue using Herculethes.
        </p>

        {error && (
          <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60"
          >
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "Log in"
              : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400 text-center">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-blue-400 hover:underline"
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-blue-400 hover:underline"
                onClick={() => setMode("login")}
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
