"use client";

import { useState, useRef, useEffect } from "react";
import { uploadAndTranscribe, type Segment } from "@/lib/apiClient";

// Split one long segment into multiple sentence‑level segments
function splitSegmentBySentences(seg: Segment): Segment[] {
  const totalDuration = seg.end - seg.start || 0.001;
  const sentences = seg.text
    .split(/(?<=[.!?])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) return [seg];

  const totalChars =
    sentences.reduce((sum, s) => sum + s.length, 0) || 1;

  const result: Segment[] = [];
  let cursor = seg.start;

  for (const sentence of sentences) {
    const ratio = sentence.length / totalChars;
    const dur = totalDuration * ratio;
    const sStart = cursor;
    const sEnd = cursor + dur;

    result.push({
      start: sStart,
      end: sEnd,
      text: sentence,
    });

    cursor = sEnd;
  }

  return result;
}

export default function HomePage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    setLoading(true);
    setError(null);
    setSegments([]);

    try {
      const data = await uploadAndTranscribe(file);

      // Split any long segments into sentence‑level segments
      const processed: Segment[] = data.segments.flatMap((seg) =>
        splitSegmentBySentences(seg)
      );
       let lastEnd = 0;
      const fixed = processed.map((s) => {
       const start = Math.max(s.start, lastEnd);
      const end = Math.max(start + 0.05, s.end); // at least 50 ms long
      lastEnd = end;
      return { ...s, start, end };
      }); 
      setSegments(fixed);
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
  }, [videoUrl]);

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
          {segments.map((s, idx) => {
            const padding=0.15; // it is 150ms tolerence to highlight
            const isActive =
              currentTime >= s.start && currentTime < s.end;

            return (
              <div
                key={idx}
                // className={
                //   "border rounded p-2 cursor-pointer " +
                //   (isActive ? "border-blue-400 bg-blue-950/40"   // darker, semi‑transparent
                //       : "border-gray-700 bg-black") //normal dark backgrounf
                // }
                className={
                "border-l-4 rounded p-2 cursor-pointer transition-colors " +
               (isActive
                   ? "border-l-blue-400 bg-zinc-900"
                    : "border-l-transparent bg-black")
                  }

                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = s.start;
                    videoRef.current.play();
                  }
                }}
              >
                <div className="font-medium">
                  {idx + 1}. {s.text}
                </div>
                <div className="text-[11px] text-gray-500">
                  {s.start.toFixed(2)}s → {s.end.toFixed(2)}s
                </div>
              </div>
            );
          })}

          {!loading && segments.length === 0 && (
            <p className="text-xs text-gray-500">
              Upload a video to generate Hinglish subtitles.
            </p>
          )}
        </div>
      </section>

      {/* Center panel - video preview */}
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
