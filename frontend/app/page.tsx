"use client";

import { useRouter } from "next/navigation";
import { getToken } from "@/lib/authClient";

export default function LandingPage() {
  const router = useRouter();

  function handleTryNow() {
    const token = getToken();
    if (token) {
      router.push("/editor");
    } else {
      router.push("/login");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold">
          CaptionCraft – Smart Hinglish Subtitles for Your Videos
        </h1>
        <p className="text-sm md:text-base text-gray-300">
          Upload a video, auto-generate Hinglish subtitles, customize fonts and colors,
          and export SRT or a fully rendered video with burned-in captions.
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={handleTryNow}
            className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium"
          >
            Try now
          </button>
          <button
            onClick={() => router.push("/login")}
            className="px-5 py-2 rounded-md border border-gray-600 text-sm font-medium"
          >
            Login
          </button>
        </div>
      </div>
    </main>
  );
}
