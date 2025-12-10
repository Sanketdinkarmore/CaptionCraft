"use client";

import { useState,useRef,useEffect } from "react";
import { uploadAndTranscribe, type Segment } from "@/lib/apiClient";

export default function HomePage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);   // <-- new

  const videoRef = useRef<HTMLVideoElement | null>(null); // <-- new

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    setLoading(true);
    setError(null);
    setSegments([]);

    try {
      const data = await uploadAndTranscribe(file);
      setSegments(data.segments);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

    useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [videoUrl]); // reattach when a new video is loaded


  return (
    <main className="min-h-screen flex">
      {/* Left panel - subtitles */}
      <section className="w-1/3 border-r p-4 overflow-y-auto">
        <h1 className="font-semibold mb-3">Subtitles</h1>

        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="mb-4"
        />

        {loading && <p>Generating subtitles...</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="space-y-2 mt-2 text-sm">
          {segments.map((s, idx) => (
            <div key={idx} className="border rounded p-2">
              <div className="font-medium">
                {idx + 1}. {s.text}
              </div>
              <div className="text-[11px] text-gray-500">
                {s.start.toFixed(2)}s → {s.end.toFixed(2)}s
              </div>
            </div>
          ))}

          {!loading && segments.length === 0 && (
            <p className="text-xs text-gray-500">
              Upload a video to generate Hinglish subtitles.
            </p>
          )}
        </div>
      </section>

      {/* Center panel - placeholder for video & styling */}
      <section className="flex-1 flex flex-col items-center justify-center p-4">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="max-h-[80vh] rounded shadow-lg"
          />
        ) : (
          <p className="text-gray-500 text-sm">
            Upload a video to see the preview here.
          </p>
        )}
      </section>
    </main>
  );
}
