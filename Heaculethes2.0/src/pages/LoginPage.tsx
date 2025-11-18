// src/pages/LoginPage.tsx
import type { FormEvent } from "react";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";

import { useAuth } from "../auth/AuthContext";
import { auth } from "../firebase";

type Mode = "login" | "register" | "reset";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else if (mode === "register") {
        await register(email, password);
      } else {
        // reset mode
        await sendPasswordResetEmail(auth, email);
        setInfo(
          "If an account with that email exists, a password reset link has been sent."
        );
      }
    } catch (err: unknown) {
      console.error(err);
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "login"
      ? "Welcome back"
      : mode === "register"
      ? "Create an account"
      : "Reset your password";

  const primaryButtonText =
    mode === "login"
      ? "Log in"
      : mode === "register"
      ? "Create account"
      : "Send reset link";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-1 text-center">{title}</h1>

        <p className="text-sm text-slate-400 mb-4 text-center">
          {mode === "login" &&
            "Sign in to continue using Herculethes."}
          {mode === "register" &&
            "Create an account to start tracking your workouts."}
          {mode === "reset" &&
            "Enter your email and we'll send you a reset link."}
        </p>

        {error && (
          <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-3 rounded-lg bg-emerald-500/10 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-200">
            {info}
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

          {/* Only show password field in login/register modes */}
          {mode !== "reset" && (
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
              {mode === "login" && (
                <button
                  type="button"
                  className="mt-1 text-xs text-blue-400 hover:underline"
                  onClick={() => {
                    setMode("reset");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? "Please wait…" : primaryButtonText}
          </button>
        </form>

        {/* Mode switch footer */}
        <p className="mt-4 text-xs text-slate-400 text-center">
          {mode === "login" && (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-blue-400 hover:underline"
                onClick={() => {
                  setMode("register");
                  setError(null);
                  setInfo(null);
                }}
              >
                Register
              </button>
            </>
          )}

          {mode === "register" && (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-blue-400 hover:underline"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setInfo(null);
                }}
              >
                Log in
              </button>
            </>
          )}

          {mode === "reset" && (
            <>
              Remembered your password?{" "}
              <button
                type="button"
                className="text-blue-400 hover:underline"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setInfo(null);
                }}
              >
                Back to login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
