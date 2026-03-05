"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login, setToken, type AuthResponse, loginWithGoogleCredential } from "@/lib/authClient";
import PasswordInput from "@/components/PasswordInput";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedToken = searchParams.get("shared");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res: AuthResponse = await login(email, password);
      setToken(res.access_token);
      // Redirect to editor with shared token if present
      if (sharedToken) {
        router.push(`/editor?shared=${sharedToken}`);
      } else {
        router.push("/editor");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleCredential(credential: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithGoogleCredential(credential);
      setToken(res.access_token);
      // Redirect to editor with shared token if present
      if (sharedToken) {
        router.push(`/editor?shared=${sharedToken}`);
      } else {
        router.push("/editor");
      }
    } catch (err: any) {
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  }

  // Minimal GIS button without extra npm deps: load script + render button
  // You must set NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend env.
  // For now, if it's missing, user can still use email/password.
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-10 pt-24">
        <div className="mx-auto grid w-full max-w-5xl gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          {/* Left: copy that matches landing tone */}
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(168,85,247,0.25)]" />
              Pick up where you left off
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                Welcome back to{" "}
                <span className="hero-gradient-text">CaptionCraft</span>
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-muted-foreground">
                Log in to keep editing subtitles, switch languages on the fly, and export sharable
                clips in a few clicks.
              </p>
            </div>

            <div className="glass-card p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-secondary-foreground/80">
                <span className="font-medium">Recent project</span>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                  Reels • Auto‑sync
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                “Mummy kya hua?” • Hinglish preset • Bold white with soft shadow, perfect for mobile.
              </p>
            </div>
          </section>

          {/* Right: login card */}
          <section className="flex items-center justify-center">
            <div className="glass-card w-full max-w-md p-6 sm:p-7 shadow-lg">
              <header className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-semibold">Log in</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Continue to your CaptionCraft studio.
                </p>
              </header>

              {error && (
                <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

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

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-secondary">Password</label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span />
                  <a
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                    href="/forgot-password"
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  disabled={loading}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-primary via-pink-500 to-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Logging you in..." : "Log in"}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>or continue with</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <GoogleButton clientId={googleClientId} onCredential={onGoogleCredential} />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>New to CaptionCraft?</span>
                  <a
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                    href="/signup"
                  >
                    Create an account
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function GoogleButton({
  clientId,
  onCredential,
}: {
  clientId: string | undefined;
  onCredential: (credential: string) => void;
}) {
  // Render nothing if missing env
  if (!clientId) {
    return (
      <p className="text-xs text-slate-400">
        Google login disabled (missing <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>).
      </p>
    );
  }

  // Load script once
  if (typeof window !== "undefined" && !(window as any).__cc_gis_loaded) {
    (window as any).__cc_gis_loaded = true;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const google = (window as any).google;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => onCredential(resp.credential),
      });
      google.accounts.id.renderButton(document.getElementById("cc-google-btn"), {
        theme: "outline",
        size: "large",
        width: 360,
      });
    };
    document.head.appendChild(script);
  }

  return (
    <div
      id="cc-google-btn"
      className="flex justify-center rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
    />
  );
}


