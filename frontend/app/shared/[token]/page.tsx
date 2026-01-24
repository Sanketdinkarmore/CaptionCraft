"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSharedProject, type Project } from "@/lib/apiClient";

export default function SharedProjectPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }

    getSharedProject(token)
      .then((proj) => {
        setProject(proj);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load shared project");
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-gray-400">Loading shared project...</p>
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Project not found"}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
          <p className="text-gray-400">
            Shared project • {project.segments.length} subtitle segments
          </p>
        </div>

        {project.thumbnail_url && (
          <div className="mb-6">
            <img
              src={project.thumbnail_url}
              alt={project.title}
              className="w-full max-w-2xl h-64 object-cover rounded border border-gray-700"
            />
          </div>
        )}

        {project.video_url && (
          <div className="mb-6">
            <video
              src={project.video_url}
              controls
              className="w-full max-w-2xl rounded border border-gray-700"
            />
          </div>
        )}

        <div className="bg-gray-900 rounded border border-gray-700 p-4">
          <h2 className="text-xl font-semibold mb-4">Subtitle Segments</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {project.segments.map((segment, idx) => (
              <div
                key={idx}
                className="p-3 bg-black rounded border border-gray-800"
              >
                <div className="text-xs text-gray-400 mb-1">
                  {segment.start.toFixed(2)}s → {segment.end.toFixed(2)}s
                </div>
                <div className="text-white">
                  {segment.content.map((span, spanIdx) => (
                    <span
                      key={spanIdx}
                      style={{
                        color: span.color || "#ffffff",
                        fontWeight: span.fontWeight === "bold" ? "bold" : "normal",
                        fontFamily: span.fontFamily || "inherit",
                        fontSize: span.fontSize ? `${span.fontSize}px` : "inherit",
                        textDecoration: span.underline ? "underline" : "none",
                        backgroundColor: span.background || "transparent",
                      }}
                    >
                      {span.text}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 mb-4">
            Want to edit this project? Sign up or log in to create your own!
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/login?shared=${token}`)}
              className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500"
            >
              Login
            </button>
            <button
              onClick={() => router.push(`/signup?shared=${token}`)}
              className="px-6 py-2 rounded border border-gray-600 hover:bg-gray-800"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

