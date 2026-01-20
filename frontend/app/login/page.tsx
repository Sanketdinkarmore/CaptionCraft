"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, setToken, type AuthResponse, loginWithGoogleCredential } from "@/lib/authClient";

export default function LoginPage() {
  const router = useRouter();
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
      router.push("/");
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
      router.push("/");
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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-gray-700 rounded-xl bg-black p-6">
        <h1 className="text-xl font-semibold text-white">Login</h1>
        <p className="text-sm text-gray-400 mt-1">Continue to CaptionCraft</p>

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
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
            {loading ? "Please wait..." : "Login"}
          </button>
        </form>

        <div className="my-4 border-t border-gray-800" />

        <div className="space-y-2">
          <a className="text-sm text-gray-300 underline" href="/signup">
            Create an account
          </a>

          <GoogleButton clientId={googleClientId} onCredential={onGoogleCredential} />
        </div>
      </div>
    </main>
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
      <p className="text-xs text-gray-500">
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

  return <div id="cc-google-btn" className="flex justify-center" />;
}


