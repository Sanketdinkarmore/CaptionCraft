// frontend/lib/apiClient.ts
export const API_BASE = "http://localhost:8000/api";

export type StyledSpan = {
  text: string;
  color?: string;
  fontWeight?: "normal" | "bold";
  underline?: boolean;
  fontFamily?: string;
  fontSize?: number;
};

export type Segment = {
  start: number;
  end: number;
  content: StyledSpan[];
  position?: {
    x: number;
    y: number;
  }
};

export type GlobalStyle = {
  fontSize: number;
  color: string;
  background: string;
  fontFamily: string;
  preset: string;
};

type RawSegment = {
  start: number;
  end: number;
  text: string;
};

export async function uploadAndTranscribe(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Transcription failed: ${res.status}`);
  }

  return (await res.json()) as { segments: RawSegment[] };
}

// UPDATED: Now accepts {segments, globalStyle, videoUrl}
export async function renderVideo(
  renderData: { segments: Segment[]; globalStyle: GlobalStyle; videoUrl: string }
): Promise<{ file_name: string }> {
  const formData = new FormData();
  const videoBlob = await fetch(renderData.videoUrl).then((r) => r.blob());
  formData.append("video", videoBlob, "input.mp4");
  formData.append("segments", JSON.stringify(renderData.segments));
  formData.append("globalStyle", JSON.stringify(renderData.globalStyle)); // NEW

  const res = await fetch(`${API_BASE}/render`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Render failed");
  return res.json() as Promise<{ file_name: string }>;
}

export async function downloadRenderedVideo(fileName: string) {
  const url = `${API_BASE}/render/download/${encodeURIComponent(fileName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed");

  const blob = await res.blob();
  const downloadUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
