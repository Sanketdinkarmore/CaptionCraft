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
  };
}

// Get plain text from a rich Segment
function segmentToText(seg: Segment): string {
  return seg.content.map((sp) => sp.text).join("");
}

// Split one long segment (rich) into multiple sentence-level segments
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

export default function HomePage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
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

  const [selectedWord, setSelectedWord] = useState<{
    segmentIndex: number | null;
    wordIndex: number | null;
  }>({ segmentIndex: null, wordIndex: null });

  const [wordStyleDraft, setWordStyleDraft] = useState<{
    color: string;
    fontFamily: string;
    bold: boolean;
  }>({
    color: "#ffd54f",
    fontFamily: "Inter, system-ui, sans-serif",
    bold: true,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  function handleDownloadSrt() {
    if (!segments.length) return;

    const srt = segmentsToSrt(segments);
    const blob = new Blob([srt], {
      type: "text/plain;charset=utf-8",
    });
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
      if (prev.length <= 1) return prev;
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  }

  function applyWordStyle(
    segmentIndex: number,
    wordIndex: number
  ) {
    setSegments((prev) => {
      const copy = [...prev];
      const seg = copy[segmentIndex];
      const text = segmentToText(seg);
      const parts = text.split(" ");
      if (!parts[wordIndex]) return prev;

      const spans: StyledSpan[] = parts.map((part, i) => {
        const suffix = i < parts.length - 1 ? " " : "";
        if (i === wordIndex) {
          return {
            text: part + suffix,
            color: wordStyleDraft.color,
            fontFamily: wordStyleDraft.fontFamily,
            fontWeight: wordStyleDraft.bold ? "bold" : "normal",
          } as StyledSpan;
        }
        return { text: part + suffix };
      });

      copy[segmentIndex] = { ...seg, content: spans };
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

  const activeSegment = segments.find(
    (s) => currentTime >= s.start && currentTime < s.end
  );

  async function handleRenderVideo() {
    if (!videoUrl || !segments.length) return;
    setRendering(true);
    setError(null);
    try {
      const { file_name } = await renderVideo(segments, videoUrl);
      alert(`Rendered file on backend: ${file_name}`);
      await downloadRenderedVideo(file_name);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Render failed");
    } finally {
      setRendering(false);
    }
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
                onChange={() =>
                  setSubtitleStyle((prev) => ({
                    ...prev,
                    background: "rgba(0,0,0,0.6)",
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
            const padding = 0.15;
            const isActive =
              currentTime >= s.start - padding &&
              currentTime < s.end + padding;

            const plainText = segmentToText(s);
            const words = plainText.split(" ");

            const isSegmentSelected =
              selectedWord.segmentIndex === idx;

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
                        copy[idx] = makeSegmentFromText(
                          s.start,
                          s.end,
                          newText
                        );
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

                {isSegmentSelected &&
                  selectedWord.wordIndex !== null && (
                    <div className="mt-2 space-y-1 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">
                          Word style:
                        </span>
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
                          <option value="Inter, system-ui, sans-serif">
                            Inter
                          </option>
                          <option value="Poppins, system-ui, sans-serif">
                            Poppins
                          </option>
                          <option value="Roboto, system-ui, sans-serif">
                            Roboto
                          </option>
                          <option value="Impact, system-ui, sans-serif">
                            Impact
                          </option>
                        </select>
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
                className="pointer-events-none absolute left-1/2 bottom-10 -translate-x-1/2 px-4 py-2 rounded max-w-[90%] text-center"
                style={{
                  fontSize: `${subtitleStyle.fontSize}px`,
                  background: subtitleStyle.background,
                }}
              >
                {activeSegment.content.map((span, i) => (
                  <span
                    key={i}
                    style={{
                      color: span.color ?? subtitleStyle.color,
                      fontWeight: span.fontWeight ?? "normal",
                      textDecoration: span.underline
                        ? "underline"
                        : "none",
                      fontFamily:
                        (span as any).fontFamily ??
                        "Inter, system-ui, sans-serif",
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
