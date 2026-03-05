"use client";

import { useState } from "react";
import { forgotPassword } from "@/lib/authClient";
import Navbar from "@/components/Navbar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      await forgotPassword(email);
      setStatus("sent");
    } catch (err: any) {
      setError(err.message || "Request failed");
      setStatus("idle");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-10 pt-24">
        <div className="mx-auto grid w-full max-w-5xl gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          {/* Left: reassurance */}
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.25)]" />
              Happens to everyone
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                Reset your access
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-muted-foreground">
                We’ll email you a secure link to set a new password. Your projects, timelines and
                exports stay untouched.
              </p>
            </div>

            <div className="glass-card p-4 sm:p-5 text-xs text-secondary-foreground/85 space-y-2">
              <p className="font-medium">Security tips</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>Use a unique password you don’t reuse on other sites.</li>
                <li>Turn on email 2FA for the inbox linked to CaptionCraft.</li>
                <li>Avoid sharing reset links – they’re single‑use and private.</li>
              </ul>
            </div>
          </section>

          {/* Right: reset request card */}
          <section className="flex items-center justify-center">
            <div className="glass-card w-full max-w-md p-6 sm:p-7 shadow-lg">
              <header className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-semibold">Forgot password</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Enter the email you use for CaptionCraft and we’ll send instructions.
                </p>
              </header>

              {error && (
                <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              {status === "sent" ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-emerald-400/40 bg-emerald-50 px-3 py-3 text-xs text-emerald-800">
                    <p className="font-medium">Reset link sent (if the email exists)</p>
                    <p className="mt-1 text-[11px] text-emerald-800/80">
                      Check your inbox (and spam) for a message from CaptionCraft. The link expires
                      after a short time for security.
                    </p>
                  </div>
                  <a
                    className="inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline"
                    href="/login"
                  >
                    Back to login
                  </a>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-secondary">Email</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@studio.in"
                      type="email"
                      className="block w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/70"
                      required
                    />
                  </div>

                  <button
                    disabled={status === "loading"}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-amber-400 via-amber-500 to-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "loading" ? "Sending reset link..." : "Send reset link"}
                  </button>

                  <div className="pt-2 text-xs text-muted-foreground">
                    <a
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                      href="/login"
                    >
                      Back to login
                    </a>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

