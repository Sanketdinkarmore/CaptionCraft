"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword, setToken } from "@/lib/authClient";

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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-gray-700 rounded-xl bg-black p-6">
        <h1 className="text-xl font-semibold text-white">Reset password</h1>
        <p className="text-sm text-gray-400 mt-1">Choose a new password for your account.</p>

        {tokenMissing && (
          <p className="text-sm text-yellow-300 mt-3">This link is missing a token. Request a new reset link.</p>
        )}

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            type="password"
            className="w-full px-3 py-2 rounded border border-gray-600 bg-black text-white"
            required
            disabled={tokenMissing}
          />
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
            type="password"
            className="w-full px-3 py-2 rounded border border-gray-600 bg-black text-white"
            required
            disabled={tokenMissing}
          />
          <button
            disabled={loading || tokenMissing}
            className="w-full px-3 py-2 rounded border border-blue-600 text-blue-300 disabled:opacity-50"
          >
            {loading ? "Please wait..." : "Reset password"}
          </button>
        </form>

        <div className="mt-4">
          <a className="text-sm text-gray-300 underline" href="/login">
            Back to login
          </a>
        </div>
      </div>
    </main>
  );
}

