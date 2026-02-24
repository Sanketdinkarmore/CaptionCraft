"use client";

import { useState } from "react";
import { forgotPassword } from "@/lib/authClient";

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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-gray-700 rounded-xl bg-black p-6">
        <h1 className="text-xl font-semibold text-white">Forgot password</h1>
        <p className="text-sm text-gray-400 mt-1">
          Enter your email and we’ll send a reset link (in dev, it prints in the backend console).
        </p>

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

        {status === "sent" ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-green-300">
              If an account exists for that email, a reset link has been sent.
            </p>
            <a className="text-sm text-gray-300 underline" href="/login">
              Back to login
            </a>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="w-full px-3 py-2 rounded border border-gray-600 bg-black text-white"
              required
            />
            <button
              disabled={status === "loading"}
              className="w-full px-3 py-2 rounded border border-blue-600 text-blue-300 disabled:opacity-50"
            >
              {status === "loading" ? "Please wait..." : "Send reset link"}
            </button>

            <div className="pt-2">
              <a className="text-sm text-gray-300 underline" href="/login">
                Back to login
              </a>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

