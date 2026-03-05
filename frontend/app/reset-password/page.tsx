"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword, setToken } from "@/lib/authClient";
import PasswordInput from "@/components/PasswordInput";
import Navbar from "@/components/Navbar";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tokenMissing = !token;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Missing reset token.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      setToken(res.access_token);
      router.push("/editor");
    } catch (err: any) {
      setError(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-10 pt-24">
        <div className="mx-auto grid w-full max-w-5xl gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          {/* Left: guidance */}
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]" />
              Fresh start secured
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                Set a new password
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-muted-foreground">
                This password protects all your CaptionCraft projects – from first drafts to final
                rendered videos.
              </p>
            </div>

            <div className="glass-card p-4 sm:p-5 text-xs text-secondary-foreground/85 space-y-2">
              <p className="font-medium">Password checklist</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>At least 8 characters (more is better).</li>
                <li>Mix of letters, numbers and symbols.</li>
                <li>Avoid names, birthdays or easily guessed phrases.</li>
              </ul>
            </div>
          </section>

          {/* Right: reset form card */}
          <section className="flex items-center justify-center">
            <div className="glass-card w-full max-w-md p-6 sm:p-7 shadow-lg">
              <header className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-semibold">Reset password</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Choose a strong, unique password you’ll remember.
                </p>
              </header>

              {tokenMissing && (
                <p className="mt-4 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This link is missing a token or has expired. Please request a new reset link from
                  the{" "}
                  <a
                    href="/forgot-password"
                    className="font-semibold underline underline-offset-4"
                  >
                    forgot password
                  </a>{" "}
                  page.
                </p>
              )}

              {error && (
                <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-secondary">New password</label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    disabled={tokenMissing}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-secondary">Confirm password</label>
                  <PasswordInput
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Type it again"
                    required
                    disabled={tokenMissing}
                  />
                </div>

                <button
                  disabled={loading || tokenMissing}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-emerald-400 via-emerald-500 to-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Updating password..." : "Reset password"}
                </button>
              </form>

              <div className="mt-4 text-xs text-muted-foreground">
                <a
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                  href="/login"
                >
                  Back to login
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

