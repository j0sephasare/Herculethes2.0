// src/pages/LoginPage.tsx
import type { FormEvent } from "react";
import { useState, useMemo } from "react";
import { sendPasswordResetEmail } from "firebase/auth";

import { useAuth } from "../auth/AuthContext";
import { auth } from "../firebase";

//  Background image 
import OLYMPUS_BG_URL from "../assets/Olympus2.jpg";

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

  const title = useMemo(() => {
    if (mode === "login") return "Return to Olympus";
    if (mode === "register") return "Ascend to the Pantheon";
    return "Restore Your Credentials";
  }, [mode]);

  const primaryButtonText =
    mode === "login"
      ? "Enter the Gates"
      : mode === "register"
      ? "Forge Account"
      : "Send Reset Scroll";

  return (
    <div
      className="min-h-screen relative text-slate-50"
      style={{
        backgroundImage: `url(${OLYMPUS_BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Golden sky overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/55 to-slate-950/85" />

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        {/* Framed marble card */}
        <div className="w-full max-w-md">
          {/* Crest / Title */}
          <div className="mb-4 text-center select-none">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-300 shadow-[0_0_0_2px_rgba(234,179,8,0.35),0_10px_40px_rgba(234,179,8,0.2)] flex items-center justify-center">
              <span className="text-2xl text-slate-900">Λ</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]">
              Herculethes
            </h1>
            <p className="mt-1 text-xs tracking-wide uppercase text-yellow-200/80">
              {title}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900/70 backdrop-blur border border-yellow-400/20 shadow-[0_0_0_1px_rgba(148,163,184,0.15)] p-6">
            <p className="text-[13px] text-slate-300/90 text-center mb-4">
              {mode === "login" && "Sign in to continue your heroic training."}
              {mode === "register" &&
                "Create your account and begin your legend."}
              {mode === "reset" &&
                "Enter your email and we’ll send a reset link."}
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
                <label className="text-[11px] uppercase tracking-wider text-yellow-200/80">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-md bg-slate-900/70 border border-slate-700/70 px-3 py-2 text-sm outline-none focus:border-yellow-400/60 focus:ring-0"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {mode !== "reset" && (
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-yellow-200/80">
                    Password
                  </label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-md bg-slate-900/70 border border-slate-700/70 px-3 py-2 text-sm outline-none focus:border-yellow-400/60 focus:ring-0"
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
                      className="mt-1 text-xs text-yellow-300 hover:underline"
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
                className="mt-2 w-full rounded-md bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-900 font-semibold text-sm px-4 py-2 shadow-[0_8px_24px_rgba(234,179,8,0.25)] hover:from-yellow-400 hover:to-amber-300 disabled:opacity-60"
              >
                {loading ? "Please wait…" : primaryButtonText}
              </button>
            </form>

            {/* Divider ornament */}
            <div className="my-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
              <span className="text-[10px] tracking-widest uppercase text-yellow-200/70">
                Or
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
            </div>

            {/* Mode switch */}
            <p className="text-center text-xs text-slate-300">
              {mode === "login" && (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    className="text-yellow-300 hover:underline"
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
                  Already forged one?{" "}
                  <button
                    type="button"
                    className="text-yellow-300 hover:underline"
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
                  Remembered it?{" "}
                  <button
                    type="button"
                    className="text-yellow-300 hover:underline"
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

          {/* Tiny footnote */}
          <p className="mt-3 text-center text-[10px] tracking-widest uppercase text-yellow-200/60">
            Strength • Honor • Consistency
          </p>
        </div>
      </div>
    </div>
  );
}
