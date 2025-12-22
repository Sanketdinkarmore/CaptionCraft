"use client";

import { useState, useRef, useEffect } from "react";
import {
  uploadAndTranscribe,
  renderVideo,
  downloadRenderedVideo,
  type Segment,
  type StyledSpan,
} from "@/lib/apiClient";

// Make a Segment with content from plain text
function makeSegmentFromText(
  start: number,
  end: number,
  text: string
): Segment {
  return {
    start,
    end,
    content: [{ text }],
    position: { x: 0.5, y: 0.8 },
  };
}

// Get plain text from a rich Segment
function segmentToText(seg: Segment): string {
  return seg.content.map((sp) => sp.text).join("");
}

// Ensure word-level spans exist for styling
function ensureWordSpans(seg: Segment): StyledSpan[] {
  const text = segmentToText(seg);
  const words = text.split(" ");
  
  return words.map((word, i) => {
    const suffix = i < words.length - 1 ? " " : "";
    return { text: word + suffix } as StyledSpan;
  });
}

// Split one long segment into sentence-level segments
function splitSegmentBySentences(seg: Segment): Segment[] {
  const fullText = segmentToText(seg);
  const totalDuration = seg.end - seg.start || 0.001;

  const sentences = fullText
    .split(/(?<=[.!?])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    return [seg];
  }

  const totalChars =
    sentences.reduce((sum, s) => sum + s.length, 0) || 1;

  const result: Segment[] = [];
  let cursor = seg.start;

  for (const sentence of sentences) {
    const ratio = sentence.length / totalChars;
    const dur = totalDuration * ratio;
    const sStart = cursor;
    const sEnd = cursor + dur;

    const newSeg: Segment = {
      start: sStart,
      end: sEnd,
      content: [{ text: sentence }],
      position: seg.position ?? { x: 0.5, y: 0.8 },
    };

    result.push(newSeg);
    cursor = sEnd;
  }

  return result;
}

function segmentsToSrt(segments: Segment[]) {
  const formatTime = (t: number) => {
    const hours = Math.floor(t / 3600);
    const minutes = Math.floor((t % 3600) / 60);
    const seconds = Math.floor(t % 60);
    const millis = Math.floor((t - Math.floor(t)) * 1000);

    const pad = (n: number, width: number) =>
      n.toString().padStart(width, "0");

    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(
      seconds,
      2
    )},${pad(millis, 3)}`;
  };

  return segments
    .map((s, i) => {
      const idx = i + 1;
      const start = formatTime(s.start);
      const end = formatTime(s.end);
      const text = segmentToText(s).trim() || "...";
      return `${idx}\n${start} --> ${end}\n${text}\n`;
    })
    .join("\n");
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export default function HomePage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [presetsOpen, setPresetsOpen] = useState(false);
  
  // GLOBAL subtitle style (affects ALL subtitles)
  const [globalStyle, setGlobalStyle] = useState<{
    fontSize: number;
    color: string;
    background: string;
    fontFamily: string;
    preset: string;
  }>({
    fontSize: 36,
    color: "#ffffff",
    background: "rgba(0, 0, 0, 0.6)",
    fontFamily: "Inter, system-ui, sans-serif",
    preset: "Classic",
  });

  // Preset definitions
  const presetStyles = {
    "Pop Art": {
      fontSize: 64,
      color: "#FF00FF",
      background: "rgba(0, 0, 0, 0.8)",
      fontFamily: "Impact, system-ui, sans-serif",
    },
    "Highlight": {
      fontSize: 48,
      color: "#FFD700",
      background: "rgba(0, 0, 0, 0.7)",
      fontFamily: "Montserrat, system-ui, sans-serif",
    },
    "Neon": {
      fontSize: 56,
      color: "#00FFFF",
      background: "rgba(0, 0, 0, 0.9)",
      fontFamily: "Roboto, system-ui, sans-serif",
    },
    "Classic": {
      fontSize: 36,
      color: "#FFFFFF",
      background: "rgba(0, 0, 0, 0.6)",
      fontFamily: "Inter, system-ui, sans-serif",
    },
    "Minimal": {
      fontSize: 40,
      color: "#E0E0E0",
      background: "rgba(0, 0, 0, 0.4)",
      fontFamily: "Poppins, system-ui, sans-serif",
    },
  };

  const [selectedWord, setSelectedWord] = useState<{
    segmentIndex: number | null;
    wordIndex: number | null;
  }>({ segmentIndex: null, wordIndex: null });

  // Individual word styling (overrides global)
  const [wordStyleDraft, setWordStyleDraft] = useState<{
    color: string;
    fontFamily: string;
    bold: boolean;
    fontSize: number;
  }>({
    color: "#ffd54f",
    fontFamily: "Inter, system-ui, sans-serif",
    bold: true,
    fontSize: 48,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Apply GLOBAL preset to ALL segments
  function applyGlobalPreset(presetName: string) {
    const preset = presetStyles[presetName as keyof typeof presetStyles];
    if (!preset) return;

    setGlobalStyle({
      fontSize: preset.fontSize,
      color: preset.color,
      background: preset.background,
      fontFamily: preset.fontFamily,
      preset: presetName,
    });
    
    setPresetsOpen(false);
  }

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
      const firstHalf: Segment = { ...current, end: mid };
      const secondHalf: Segment = { ...current, start: mid };
      const copy = [...prev];
      copy.splice(index, 1, firstHalf, secondHalf);
      return copy;
    });
  }

  function handleDelete(index: number) {
    setSegments((prev) => {
      if (prev.length <= 1) return prev;
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  }

  function applyWordStyle(segmentIndex: number, wordIndex: number) {
    setSegments((prev) => {
      const copy = [...prev];
      const seg = copy[segmentIndex];
      if (!seg) return prev;

      const wordSpans = ensureWordSpans(seg);
      
      if (wordSpans[wordIndex]) {
        wordSpans[wordIndex] = {
          ...wordSpans[wordIndex],
          color: wordStyleDraft.color,
          fontFamily: wordStyleDraft.fontFamily,
          fontWeight: wordStyleDraft.bold ? "bold" : "normal",
          fontSize: wordStyleDraft.fontSize,
        } as StyledSpan;
      }

      copy[segmentIndex] = { ...seg, content: wordSpans };
      return copy;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setLoading(true);
    setError(null);
    setSegments([]);
    setSelectedWord({ segmentIndex: null, wordIndex: null });

    try {
      const data = await uploadAndTranscribe(file);
      const withContent: Segment[] = data.segments.map((raw) =>
        makeSegmentFromText(raw.start, raw.end, raw.text)
      );
      const processed: Segment[] = withContent.flatMap((seg) =>
        splitSegmentBySentences(seg)
      );

      let lastEnd = 0;
      const fixed = processed.map((s) => {
        const start = Math.max(s.start, lastEnd);
        const end = Math.max(start + 0.05, s.end);
        lastEnd = end;
        return {
          ...s,
          start,
          end,
          position: s.position ?? { x: 0.5, y: 0.8 },
        } as Segment;
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

  const activeSegment = segments.find(
    (s) => currentTime >= s.start && currentTime < s.end
  );

  // FIXED: Send globalStyle to backend
  async function handleRenderVideo() {
    if (!videoUrl || !segments.length) return;
    
    console.log("sending to backend:", JSON.stringify({
      segments,
      globalStyle,
      videoUrl
    }, null, 2));
    
    setRendering(true);
    setError(null);
    try {
      const { file_name } = await renderVideo({
        segments,
        globalStyle,
        videoUrl: videoUrl!,
      });
      await downloadRenderedVideo(file_name);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Render failed");
    } finally {
      setRendering(false);
    }
  }

  function makePositionHandlers(idx: number) {
    return {
      onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const rect = video.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;

        const seg = segments[idx];
        const pos = seg.position ?? { x: 0.5, y: 0.8 };
        const startPxX = rect.left + pos.x * rect.width;
        const startPxY = rect.top + pos.y * rect.height;

        const onMove = (ev: MouseEvent) => {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          const newPxX = startPxX + dx;
          const newPxY = startPxY + dy;
          const newX = clamp01((newPxX - rect.left) / rect.width);
          const newY = clamp01((newPxY - rect.top) / rect.height);

          setSegments((prev) => {
            const copy = [...prev];
            copy[idx] = {
              ...copy[idx],
              position: { x: newX, y: newY },
            };
            return copy;
          });
        };

        const onUp = () => {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      },
    };
  }

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

        {/* GLOBAL CONTROLS: Presets + Size/Text/Bg */}
        <div className="mb-3 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleDownloadSrt}
              disabled={!segments.length}
              className="px-3 py-1 text-xs rounded border border-gray-600 disabled:opacity-40"
            >
              Export .srt
            </button>
            <button
              onClick={handleRenderVideo}
              disabled={!segments.length || !videoUrl || rendering}
              className="px-3 py-1 text-xs rounded border border-green-600 disabled:opacity-40"
            >
              {rendering ? "Rendering..." : "Render Video"}
            </button>
          </div>

          {/* DROPDOWN: Preset Style Selection */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPresetsOpen(!presetsOpen)}
              className="w-full px-3 py-2 rounded border border-gray-600 bg-black text-white text-xs flex items-center justify-between hover:bg-gray-900"
            >
              <span>Presets</span>
              <span className={`transition-transform ${presetsOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {presetsOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-gray-600 rounded shadow-lg z-10">
                {Object.entries(presetStyles).map(([name]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => applyGlobalPreset(name)}
                    className={`w-full px-3 py-2 text-xs text-left rounded-none border-b border-gray-700 last:border-b-0 ${
                      globalStyle.preset === name
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        : "bg-black text-white hover:bg-gray-900"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Size/Text/Bg Controls (now using globalStyle) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="flex items-center gap-1">
              Size
              <input
                type="number"
                min={12}
                max={128}
                value={globalStyle.fontSize}
                onChange={(e) =>
                  setGlobalStyle((prev) => ({
                    ...prev,
                    fontSize: Number(e.target.value || 36),
                  }))
                }
                className="w-16 bg-black border border-gray-700 rounded px-1 py-[2px]"
              />
            </label>

            <label className="flex items-center gap-1">
              Text
              <input
                type="color"
                value={globalStyle.color}
                onChange={(e) =>
                  setGlobalStyle((prev) => ({
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
                value={globalStyle.background.replace("rgba(0,0,0,", "").replace("0.6)", "0.6").slice(0,7)}
                onChange={(e) =>
                  setGlobalStyle((prev) => ({
                    ...prev,
                    background: `rgba(0,0,0,0.6)`,
                  }))
                }
                className="w-8 h-5 p-0 border border-gray-700 rounded"
              />
            </label>

            <label className="flex items-center gap-1">
              Font
              <select
                value={globalStyle.fontFamily}
                onChange={(e) =>
                  setGlobalStyle((prev) => ({
                    ...prev,
                    fontFamily: e.target.value,
                  }))
                }
                className="bg-black border border-gray-700 rounded px-1 py-[1px] text-[11px]"
              >
                <option value="Inter, system-ui, sans-serif">Inter</option>
                <option value="Impact, system-ui, sans-serif">Impact</option>
                <option value="Roboto, system-ui, sans-serif">Roboto</option>
                <option value="Poppins, system-ui, sans-serif">Poppins</option>
              </select>
            </label>
          </div>
        </div>

        {loading && <p>Generating subtitles...</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="space-y-2 mt-2 text-sm">
          {segments.map((s, idx) => {
            const padding = 0.15;
            const isActive =
              currentTime >= s.start - padding &&
              currentTime < s.end + padding;

            const plainText = segmentToText(s);
            const words = plainText.split(" ");
            const isSegmentSelected = selectedWord.segmentIndex === idx;

            return (
              <div
                key={idx}
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
                  <span className="text-xs text-gray-400 mt-1">
                    {idx + 1}.
                  </span>
                  <textarea
                    value={plainText}
                    onChange={(e) => {
                      const newText = e.target.value;
                      setSegments((prev) => {
                        const copy = [...prev];
                        const seg = copy[idx];
                        copy[idx] = {
                          ...seg,
                          content: [{ text: newText }],
                        };
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

                <div className="flex flex-wrap gap-1 text-[11px] mt-1">
                  {words.map((w, wIdx) => {
                    const isSelected =
                      selectedWord.segmentIndex === idx &&
                      selectedWord.wordIndex === wIdx;

                    return (
                      <button
                        key={wIdx}
                        type="button"
                        className={
                          "px-1 py-[1px] rounded border " +
                          (isSelected
                            ? "border-blue-400 bg-blue-900"
                            : "border-gray-600 bg-zinc-800")
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWord({
                            segmentIndex: idx,
                            wordIndex: wIdx,
                          });
                        }}
                      >
                        {w}
                      </button>
                    );
                  })}
                </div>

                {isSegmentSelected && selectedWord.wordIndex !== null && (
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Word:</span>
                      <input
                        type="color"
                        value={wordStyleDraft.color}
                        onChange={(e) =>
                          setWordStyleDraft((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                        className="w-8 h-5 p-0 border border-gray-700 rounded"
                      />
                      <select
                        value={wordStyleDraft.fontFamily}
                        onChange={(e) =>
                          setWordStyleDraft((prev) => ({
                            ...prev,
                            fontFamily: e.target.value,
                          }))
                        }
                        className="bg-black border border-gray-700 rounded px-1 py-[1px]"
                      >
                        <option value="Inter, system-ui, sans-serif">Inter</option>
                        <option value="Poppins, system-ui, sans-serif">Poppins</option>
                        <option value="Roboto, system-ui, sans-serif">Roboto</option>
                        <option value="Impact, system-ui, sans-serif">Impact</option>
                      </select>
                      <input
                        type="number"
                        min={8}
                        max={128}
                        value={wordStyleDraft.fontSize}
                        onChange={(e) =>
                          setWordStyleDraft((prev) => ({
                            ...prev,
                            fontSize: Number(e.target.value || 36),
                          }))
                        }
                        className="w-12 bg-black border border-gray-700 rounded px-1 py-[1px]"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWordStyleDraft((prev) => ({
                            ...prev,
                            bold: !prev.bold,
                          }));
                        }}
                        className={
                          "px-2 py-[1px] rounded border " +
                          (wordStyleDraft.bold
                            ? "border-yellow-400 text-yellow-300"
                            : "border-gray-600 text-gray-300")
                        }
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyWordStyle(
                            selectedWord.segmentIndex!,
                            selectedWord.wordIndex!
                          );
                        }}
                        className="px-2 py-[1px] rounded border border-blue-500 text-blue-300"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-gray-500 flex items-center justify-between mt-2">
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

      <section className="flex-1 flex flex-col items-center justify-center p-4">
        {videoUrl ? (
          <div className="relative inline-block">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="max-h-[80vh] rounded shadow-lg"
            />

            {activeSegment && (
              <div
                {...makePositionHandlers(segments.indexOf(activeSegment))}
                className="pointer-events-auto absolute px-4 py-2 rounded max-w-[90%] text-center cursor-move"
                style={{
                  fontSize: `${globalStyle.fontSize}px`,
                  background: globalStyle.background,
                  fontFamily: globalStyle.fontFamily,
                  left: `${(activeSegment.position?.x ?? 0.5) * 100}%`,
                  top: `${(activeSegment.position?.y ?? 0.8) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {activeSegment.content.map((span, i) => (
                  <span
                    key={i}
                    style={{
                      color: span.color ?? globalStyle.color,
                      fontWeight: span.fontWeight ?? "normal",
                      fontFamily:
                        (span as any).fontFamily ?? globalStyle.fontFamily,
                      fontSize:
                        (span as any).fontSize ?? globalStyle.fontSize,
                    }}
                  >
                    {span.text}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Upload a video to see the preview here.
          </p>
        )}
      </section>
    </main>
  );
}