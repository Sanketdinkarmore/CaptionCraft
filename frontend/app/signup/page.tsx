"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signup, setToken, type AuthResponse } from "@/lib/authClient";
import PasswordInput from "@/components/PasswordInput";
import Navbar from "@/components/Navbar";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedToken = searchParams.get("shared");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res: AuthResponse = await signup(name, email, password);
      setToken(res.access_token);
      if (sharedToken) {
        router.push(`/editor?shared=${sharedToken}`);
      } else {
        router.push("/editor");
      }
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-10 pt-24">
        <div className="mx-auto grid w-full max-w-5xl gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          {/* Left: brand / story that matches hero */}
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(168,85,247,0.25)]" />
              Captions in Hindi, Marathi, Hinglish & English
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                Make captions feel{" "}
                <span className="hero-gradient-text">on‑brand</span>
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-muted-foreground">
                Create a free CaptionCraft studio account to sync subtitles, apply presets, and
                export SRT / MP4 without touching a timeline.
              </p>
            </div>

            <div className="glass-card p-4 sm:p-5 space-y-3">
              <p className="text-xs font-medium text-secondary-foreground/80">You’ll be able to:</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="badge-sticker bg-white/70 text-secondary-foreground border border-border/60">
                  Auto‑sync caption timing
                </span>
                <span className="badge-sticker bg-accent/70 text-accent-foreground border border-border/40">
                  Switch between 4 languages
                </span>
                <span className="badge-sticker bg-white/80 text-secondary-foreground border border-border/60">
                  Export SRT or burned‑in video
                </span>
              </div>
            </div>
          </section>

          {/* Right: signup card */}
          <section className="flex items-center justify-center">
            <div className="glass-card w-full max-w-md p-6 sm:p-7 shadow-lg">
              <header className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-semibold">Create your account</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No credit card required. Just your email and a password.
                </p>
              </header>

              {error && (
                <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-secondary">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What should we call you?"
                    className="block w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/70"
                    required
                  />
                </div>

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

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-secondary">Password</label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                </div>

                <button
                  disabled={loading}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-primary via-pink-500 to-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating your account..." : "Sign up"}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                <span>Already using CaptionCraft?</span>
                <a
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                  href="/login"
                >
                  Log in
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


