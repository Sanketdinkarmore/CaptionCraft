"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signup, setToken, type AuthResponse } from "@/lib/authClient";

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
      // Redirect to editor with shared token if present
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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-gray-700 rounded-xl bg-black p-6">
        <h1 className="text-xl font-semibold text-white">Create account</h1>
        <p className="text-sm text-gray-400 mt-1">Start using CaptionCraft</p>

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full px-3 py-2 rounded border border-gray-600 bg-black text-white"
            required
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full px-3 py-2 rounded border border-gray-600 bg-black text-white"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full px-3 py-2 rounded border border-gray-600 bg-black text-white"
            required
          />
          <button
            disabled={loading}
            className="w-full px-3 py-2 rounded border border-blue-600 text-blue-300 disabled:opacity-50"
          >
            {loading ? "Please wait..." : "Sign up"}
          </button>
        </form>

        <div className="my-4 border-t border-gray-800" />
        <a className="text-sm text-gray-300 underline" href="/login">
          Already have an account? Login
        </a>
      </div>
    </main>
  );
}


