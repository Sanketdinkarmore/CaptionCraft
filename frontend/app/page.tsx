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

function segmentsToSrt(segments: { start: number; end: number; text: string }[]) {
  const formatTime = (t: number) => {
    const hours = Math.floor(t / 3600);
    const minutes = Math.floor((t % 3600) / 60);
    const seconds = Math.floor(t % 60);
    const millis = Math.floor((t - Math.floor(t)) * 1000);

    const pad = (n: number, width: number) => n.toString().padStart(width, "0");

    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(millis, 3)}`;
  };

  return segments
    .map((s, i) => {
      const idx = i + 1;
      const start = formatTime(s.start);
      const end = formatTime(s.end);
      const text = s.text.trim() || "...";
      return `${idx}\n${start} --> ${end}\n${text}\n`;
    })
    .join("\n");
}









export default function HomePage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
    const [subtitleStyle, setSubtitleStyle] = useState<{
    fontSize: number;
    color: string;
    background: string;
  }>({
    fontSize: 24,
    color: "#ffffff",
    background: "rgba(0, 0, 0, 0.6)",
  });




  const videoRef = useRef<HTMLVideoElement | null>(null);

  function handleDownloadSrt() {
    if (!segments.length) return;

    const srt = segmentsToSrt(segments);
    const blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "subtitles.srt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }


  function handleAddBelow(index: number) {
    setSegments((prev) => {
      if (!prev.length) return prev;
      const current = prev[index];
      const mid = (current.start + current.end) / 2;

      const firstHalf: Segment = {
        ...current,
        end: mid,
      };
      const secondHalf: Segment = {
        ...current,
        start: mid,
      };

      const copy = [...prev];
      copy.splice(index, 1, firstHalf, secondHalf);
      return copy;
    });
  }

  function handleDelete(index: number) {
    setSegments((prev) => {
      if (prev.length <= 1) return prev; // keep at least one line
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  }







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
      <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleDownloadSrt}
            disabled={!segments.length}
            className="px-3 py-1 text-xs rounded border border-gray-600 disabled:opacity-40"
          >
            Export .srt
          </button>
      <div className="flex flex-wrap items-center gap-2 text-xs">
      <label className="flex items-center gap-1">
            Size
            <input
              type="number"
              min={12}
              max={64}
              value={subtitleStyle.fontSize}
              onChange={(e) =>
                setSubtitleStyle((prev) => ({
                  ...prev,
                  fontSize: Number(e.target.value || 24),
                }))
              }
              className="w-14 bg-black border border-gray-700 rounded px-1 py-[2px]"
            />
          </label>

          <label className="flex items-center gap-1">
            Text
            <input
              type="color"
              value={subtitleStyle.color}
              onChange={(e) =>
                setSubtitleStyle((prev) => ({
                  ...prev,
                  color: e.target.value,
                }))
              }
              className="w-8 h-5 p-0 border border-gray-700 rounded"
            />
          </label>

          <label className="flex items-center gap-1">
            Bg
            <input
              type="color"
              value={"#000000"}
              onChange={(e) =>
                setSubtitleStyle((prev) => ({
                  ...prev,
                  background: "rgba(0,0,0,0.6)", // keep semi‑transparent for now
                }))
              }
              className="w-8 h-5 p-0 border border-gray-700 rounded"
            />
          </label>
  </div>

      </div>

      
        {loading && <p>Generating subtitles...</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="space-y-2 mt-2 text-sm">
          {segments.map((s, idx) => {
           const padding = 0.15; // 150ms tolerance
          const isActive =
            currentTime >= s.start - padding && currentTime < s.end + padding;


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
                <div className="flex items-start gap-2">
      <span className="text-xs text-gray-400 mt-1">{idx + 1}.</span>
      <textarea
        value={s.text}
        onChange={(e) => {
          const newText = e.target.value;
          setSegments((prev) => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], text: newText };
            return copy;
          });
        }}
        className={
          "w-full bg-transparent outline-none resize-none text-sm " +
          (isActive ? "text-white" : "text-gray-200")
        }
        rows={1}
      />
    </div>
                    <div className="text-[11px] text-gray-500 flex items-center justify-between mt-1">
      <span>
        {s.start.toFixed(2)}s → {s.end.toFixed(2)}s
      </span>
      <span className="flex gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAddBelow(idx);
          }}
          className="px-1 py-[1px] text-[10px] border border-gray-600 rounded"
        >
          + split
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(idx);
          }}
          className="px-1 py-[1px] text-[10px] border border-red-500 text-red-400 rounded"
        >
          del
        </button>
      </span>
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
