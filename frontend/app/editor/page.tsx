"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  uploadAndTranscribe,
  renderVideo,
  downloadRenderedVideo,
  saveProject,
  updateProject,
  loadProject,
  listProjects,
  deleteProject,
  uploadVideo,
  uploadThumbnail,
  generateShareToken,
  revokeShareToken,
  getSharedProject,
  type Segment,
  type StyledSpan,
  type Project,
  type Collection,
  listCollections,
  createCollection,
} from "@/lib/apiClient";
import { getToken, me, clearToken, type AuthUser } from "@/lib/authClient";

function makeSegmentFromText(start: number, end: number, text: string): Segment {
  return { start, end, content: [{ text }], position: { x: 0.5, y: 0.8 } };
}

function segmentToText(seg: Segment): string {
  return seg.content.map((sp) => sp.text).join("");
}

function ensureWordSpans(seg: Segment): StyledSpan[] {
  const text = segmentToText(seg);
  const words = text.split(" ");
  return words.map((word, i) => {
    const suffix = i < words.length - 1 ? " " : "";
    return { text: word + suffix } as StyledSpan;
  });
}

function splitSegmentBySentences(seg: Segment): Segment[] {
  const fullText = segmentToText(seg);
  const totalDuration = seg.end - seg.start || 0.001;
  const sentences = fullText.split(/(?<=[.!?])/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 1) return [seg];
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0) || 1;
  const result: Segment[] = [];
  let cursor = seg.start;
  for (const sentence of sentences) {
    const ratio = sentence.length / totalChars;
    const dur = totalDuration * ratio;
    result.push({ start: cursor, end: cursor + dur, content: [{ text: sentence }], position: seg.position ?? { x: 0.5, y: 0.8 } });
    cursor += dur;
  }
  return result;
}

function segmentsToSrt(segments: Segment[]) {
  const formatTime = (t: number) => {
    const hours = Math.floor(t / 3600);
    const minutes = Math.floor((t % 3600) / 60);
    const seconds = Math.floor(t % 60);
    const millis = Math.floor((t - Math.floor(t)) * 1000);
    const pad = (n: number, width: number) => n.toString().padStart(width, "0");
    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(millis, 3)}`;
  };
  return segments.map((s, i) => {
    const text = segmentToText(s).trim() || "...";
    return `${i + 1}\n${formatTime(s.start)} --> ${formatTime(s.end)}\n${text}\n`;
  }).join("\n");
}

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

type MusicTrack = {
  id: string;
  name: string;
  artist?: string;
  url: string;
  durationLabel?: string;
  mood?: string;
};

const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "bensound-hearty",
    name: "Bensound - Hearty",
    artist: "Instrumental",
    url: "/music/bensound-hearty.mp3",
    durationLabel: "2:31",
    mood: "Warm",
  },
  {
    id: "organic-flow",
    name: "Organic Flow",
    artist: "Aberrant Realities",
    url: "/music/aberrantrealities-organic-flow-1015-remastered-485950.mp3",
    durationLabel: "3:45",
    mood: "Organic",
  },
  {
    id:"beanie",
    name: "Beanie",
    artist: "Instrumental",
    url: "/music/beanie.mp3",
    durationLabel: "0:11",
    mood: "Warm",
  },
  { id:"without-me",
    name: "Without Me",
    artist: "Eminem",
    url: "/music/without_me_eminem_inst.mp3",
    durationLabel: "0:30",
    mood: "Punchy",
  },
  {
    id:"blade_runner",
    name: "Blade Runner",
    artist: "Instrumental",
    url: "/music/blade_runner_2049.mp3",
    durationLabel: "0:30",
    mood: "Warm",
  }

];

// ─── Icons ───────────────────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const SaveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/>
  </svg>
);
const FolderIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
  </svg>
);
const ExportIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const RenderIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5,3 19,12 5,21 5,3"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const SplitIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="21" y1="12" x2="3" y2="12"/><polyline points="9,6 3,12 9,18"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
  </svg>
);
const HighlightIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedToken = searchParams.get("shared");

  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"subtitles" | "music">("subtitles");
  const [styleTab, setStyleTab] = useState<"classic" | "dynamic">("dynamic");

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [exportResolution, setExportResolution] = useState<"original" | "720p" | "1080p">("original");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [selectedMusicId, setSelectedMusicId] = useState<string | null>(null);
  const [previewingMusicId, setPreviewingMusicId] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState<number>(30);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [collectionFilterId, setCollectionFilterId] = useState<string | null>(null);
  const [collectionsDropdownOpen, setCollectionsDropdownOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    me().then((user) => {
      setCurrentUser(user);
      setAuthChecked(true);
      if (sharedToken) {
        getSharedProject(sharedToken).then((project) => {
          setSegments(project.segments);
          if (project.global_style) setGlobalStyle(project.global_style);
          if (project.video_url) setVideoUrl(project.video_url);
          if (project.thumbnail_url) setThumbnailUrl(project.thumbnail_url);
          setProjectTitle(project.title);
        }).catch(console.error);
      }
    }).catch(() => { clearToken(); router.push("/login"); });
  }, [router, sharedToken]);

  const [globalStyle, setGlobalStyle] = useState<{
    fontSize: number; color: string; background: string; fontFamily: string; preset: string;
  }>({
    fontSize: 28, color: "#ffffff", background: "transparent",
    fontFamily: "Inter, system-ui, sans-serif", preset: "Classic",
  });

  const presetStyles = {
   "Cinematic":       { fontSize: 32, color: "#FFFFFF", background: "transparent", fontFamily: "Montserrat, system-ui, sans-serif" },
  "YouTube Bold":    { fontSize: 48, color: "#FFFFFF", background: "transparent", fontFamily: "Poppins, system-ui, sans-serif" },
  "Reels Clean":     { fontSize: 40, color: "#FFFFFF", background: "transparent", fontFamily: "Inter, system-ui, sans-serif" },
  "Podcast Minimal": { fontSize: 28, color: "#E5E5E5", background: "transparent", fontFamily: "Roboto, system-ui, sans-serif" },
  "Hinglish Punch":  { fontSize: 45, color: "#00FF99", background: "transparent", fontFamily: "Poppins, system-ui, sans-serif" },
  "Neon Glow Pink":  { fontSize: 55, color: "#FF4DFF", background: "transparent", fontFamily: "Orbitron, system-ui, sans-serif" },
  "Neon Green":      { fontSize: 52, color: "#39FF14", background: "transparent", fontFamily: "Impact, system-ui, sans-serif" },
  "Soft Pastel":     { fontSize: 35, color: "#FF1493", background: "transparent", fontFamily: "Nunito, system-ui, sans-serif" },
  "Dark Mode Pro":   { fontSize: 32, color: "#F1F1F1", background: "transparent", fontFamily: "Inter, system-ui, sans-serif" },
  "Bold Yellow":     { fontSize: 48, color: "#FFD700", background: "transparent", fontFamily: "Poppins, system-ui, sans-serif" },
  "Instagram Story": { fontSize: 45, color: "#FFFFFF", background: "transparent", fontFamily: "Poppins, system-ui, sans-serif" },
  "Retro VHS":       { fontSize: 40, color: "#00FFD1", background: "transparent", fontFamily: "Courier Prime, monospace" },
  "Luxury Serif":    { fontSize: 30, color: "#F5F5F5", background: "transparent", fontFamily: "Playfair Display, serif" },
  "Gaming HUD":      { fontSize: 38, color: "#00E5FF", background: "transparent", fontFamily: "Orbitron, system-ui, sans-serif" },
  "Minimal White":   { fontSize: 26, color: "#FFFFFF", background: "transparent", fontFamily: "Inter, system-ui, sans-serif" },
};

  const [selectedWord, setSelectedWord] = useState<{ segmentIndex: number | null; wordIndex: number | null }>({ segmentIndex: null, wordIndex: null });
 
  const [wordStyleDraft, setWordStyleDraft] = useState<{ color: string; fontFamily: string; bold: boolean; fontSize: number; background: string }>({
    color: "#00FFD1", fontFamily: "Inter, system-ui, sans-serif", bold: true, fontSize:36, background: "#FFD700",
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const selectedMusic = selectedMusicId ? MUSIC_TRACKS.find((t) => t.id === selectedMusicId) ?? null : null;

  function applyGlobalPreset(presetName: string) {
    const preset = presetStyles[presetName as keyof typeof presetStyles];
    if (!preset) return;
    setGlobalStyle({ ...preset, preset: presetName });
    setPresetsOpen(false);
  }

  function handleDownloadSrt() {
    if (!segments.length) return;
    const srt = segmentsToSrt(segments);
    const blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "subtitles.srt";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function handleAddBelow(index: number) {
    setSegments((prev) => {
      const current = prev[index];
      const mid = (current.start + current.end) / 2;
      const copy = [...prev];
      copy.splice(index, 1, { ...current, end: mid }, { ...current, start: mid });
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
          // background: wordStyleDraft.background,
        } as StyledSpan;
      }
      copy[segmentIndex] = { ...seg, content: wordSpans };
      return copy;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setLoading(true);
    setError(null);
    setSegments([]);
    setSelectedWord({ segmentIndex: null, wordIndex: null });
    setCurrentProjectId(null);
    setProjectTitle("Untitled Project");
    setUploadProgress(10);
    try {
      setUploadProgress(30);
      const data = await uploadAndTranscribe(file);
      setUploadProgress(80);
      const withContent: Segment[] = data.segments.map((raw: any) => makeSegmentFromText(raw.start, raw.end, raw.text));
      const processed: Segment[] = withContent.flatMap((seg) => splitSegmentBySentences(seg));
      let lastEnd = 0;
      const fixed = processed.map((s) => {
        const start = Math.max(s.start, lastEnd);
        const end = Math.max(start + 0.05, s.end);
        lastEnd = end;
        return { ...s, start, end, position: s.position ?? { x: 0.5, y: 0.8 } } as Segment;
      });
      setSegments(fixed);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 500);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
      setUploadProgress(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [videoUrl]);

  // Keep background music in sync with the main video for preview
  useEffect(() => {
    const video = videoRef.current;
    const audio = musicAudioRef.current;
    if (!video || !audio) return;

    const syncTime = () => {
      if (!isNaN(video.currentTime)) {
        audio.currentTime = video.currentTime;
      }
    };

    const handlePlay = () => {
      if (!selectedMusic) return;
      if (!audio.src || !audio.src.includes(selectedMusic.url)) {
        audio.src = selectedMusic.url;
      }
      syncTime();
      audio.volume = musicVolume / 100;
      audio.loop = true;
      audio.play().catch(() => {});
    };

    const handlePause = () => {
      audio.pause();
    };

    const handleSeeking = () => {
      syncTime();
    };

    const handleEnded = () => {
      audio.pause();
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("ended", handleEnded);
    };
  }, [selectedMusic, musicVolume]);

  // Apply volume changes to both background and preview audio
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = musicVolume / 100;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.volume = musicVolume / 100;
    }
  }, [musicVolume]);

  const activeSegment = segments.find((s) => currentTime >= s.start && currentTime < s.end);

  async function handleRenderVideo() {
    if (!videoUrl || !segments.length) return;
    const musicUrlForRender =
      selectedMusic && typeof window !== "undefined"
        ? `${window.location.origin}${selectedMusic.url}`
        : undefined;
    setRendering(true);
    setError(null);
    try {
      const { file_name, output_resolution } = await renderVideo({
        segments,
        globalStyle,
        videoUrl: videoUrl!,
        resolution: exportResolution,
        musicUrl: musicUrlForRender,
        musicVolume: musicVolume / 100,
      });
      if (output_resolution) alert(`Video rendered successfully!\nResolution: ${output_resolution}\nSelected: ${exportResolution}`);
      await downloadRenderedVideo(file_name);
    } catch (err: any) {
      setError(err.message ?? "Render failed");
    } finally {
      setRendering(false);
    }
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const result = await uploadThumbnail(file);
      setThumbnailUrl(result.thumbnail_url);
      if (currentProjectId) await updateProject(currentProjectId, { thumbnail_url: result.thumbnail_url });
    } catch (err: any) {
      setError(err.message || "Failed to upload thumbnail");
    } finally {
      setLoading(false);
    }
  }

  async function handleShareProject() {
    if (!currentProjectId) { setError("Please save the project first"); return; }
    try {
      const result = await generateShareToken(currentProjectId);
      setShareToken(result.share_token);
      const fullUrl = `${window.location.origin}/shared/${result.share_token}`;
      setShareUrl(fullUrl);
      await navigator.clipboard.writeText(fullUrl);
      alert("Share link copied to clipboard!");
    } catch (err: any) {
      setError(err.message || "Failed to generate share link");
    }
  }

  async function handleRevokeShare() {
    if (!currentProjectId) return;
    try {
      await revokeShareToken(currentProjectId);
      setShareToken(null); setShareUrl(null);
      alert("Share link revoked");
    } catch (err: any) {
      setError(err.message || "Failed to revoke share link");
    }
  }

  async function handleSaveProject() {
    if (!segments.length) { setError("No subtitles to save"); return; }
    setSaving(true); setError(null);
    try {
      let videoUrlToSave = videoUrl;
      let thumbnailUrlToSave = thumbnailUrl;
      if (videoUrl && videoUrl.startsWith("blob:") && videoFile) {
        setUploadProgress(0);
        try {
          const uploadResult = await uploadVideo(videoFile, true, (progress) => setUploadProgress(progress));
          videoUrlToSave = uploadResult.video_url;
          if (uploadResult.thumbnail_url && !thumbnailUrlToSave) {
            thumbnailUrlToSave = uploadResult.thumbnail_url;
            setThumbnailUrl(uploadResult.thumbnail_url);
          }
        } catch (uploadErr: any) {
          throw new Error(`Failed to upload video: ${uploadErr.message || "Unknown error"}`);
        } finally {
          setUploadProgress(null);
        }
      }
      const projectData = {
        title: projectTitle,
        user_id: currentUser?.id || null,
        video_filename: videoFile?.name || (videoUrl ? "video.mp4" : null),
        video_url: videoUrlToSave,
        thumbnail_url: thumbnailUrlToSave,
        segments,
        global_style: globalStyle,
        collection_id: selectedCollectionId,
      };
      let savedProject: Project;
      if (currentProjectId) {
        savedProject = await updateProject(currentProjectId, projectData);
      } else {
        savedProject = await saveProject(projectData);
        setCurrentProjectId(savedProject.id);
      }
      await loadProjectsList();
      alert("Project saved successfully!");
    } catch (err: any) {
      setError(err.message ?? "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  async function handleLoadProject(projectId: string) {
    setLoading(true); setError(null);
    try {
      const project = await loadProject(projectId);
      setSegments(project.segments);
      if (project.global_style) setGlobalStyle(project.global_style);
      if (project.thumbnail_url) setThumbnailUrl(project.thumbnail_url);
      if (project.share_token) {
        setShareToken(project.share_token);
        setShareUrl(`${window.location.origin}/shared/${project.share_token}`);
      }
      if (project.video_url) {
        if (project.video_url.startsWith("https://") || project.video_url.startsWith("http://")) {
          setVideoUrl(project.video_url); setVideoFile(null);
        } else if (project.video_url.startsWith("data:")) {
          setVideoUrl(project.video_url); setVideoFile(null);
        } else if (project.video_url.startsWith("blob:")) {
          setError("Video file not available. Please re-upload the video.");
          setVideoUrl(null); setVideoFile(null);
        } else {
          setVideoUrl(project.video_url); setVideoFile(null);
        }
      } else {
        setVideoUrl(null); setVideoFile(null);
      }
      setProjectTitle(project.title);
      setCurrentProjectId(project.id);
      setSelectedCollectionId(project.collection_id ?? null);
      setProjectsOpen(false);
    } catch (err: any) {
      setError(err.message ?? "Failed to load project");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProject(projectId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(projectId);
      if (currentProjectId === projectId) { setCurrentProjectId(null); setProjectTitle("Untitled Project"); }
      await loadProjectsList();
    } catch (err: any) {
      setError(err.message ?? "Failed to delete project");
    }
  }

  async function loadProjectsList() {
    setLoadingProjects(true);
    try {
      const projectList = await listProjects(collectionFilterId || undefined);
      setProjects(projectList);
    } catch (err: any) {
      setError(err.message ?? "Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }

  function handleLogout() { clearToken(); setCurrentUser(null); router.push("/login"); }

  async function loadCollectionsList() {
    setCollectionsLoading(true);
    try {
      const cols = await listCollections();
      setCollections(cols);
    } catch (err: any) {
      setError(err.message ?? "Failed to load collections");
    } finally {
      setCollectionsLoading(false);
    }
  }

  useEffect(() => {
    if (projectsOpen) {
      loadProjectsList();
      loadCollectionsList();
    }
  }, [projectsOpen, collectionFilterId]);

  function makePositionHandlers(idx: number) {
    return {
      onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const rect = video.getBoundingClientRect();
        const startX = e.clientX; const startY = e.clientY;
        const seg = segments[idx];
        const pos = seg.position ?? { x: 0.5, y: 0.8 };
        const startPxX = rect.left + pos.x * rect.width;
        const startPxY = rect.top + pos.y * rect.height;
        const onMove = (ev: MouseEvent) => {
          const newX = clamp01((startPxX + ev.clientX - startX - rect.left) / rect.width);
          const newY = clamp01((startPxY + ev.clientY - startY - rect.top) / rect.height);
          setSegments((prev) => { const copy = [...prev]; copy[idx] = { ...copy[idx], position: { x: newX, y: newY } }; return copy; });
        };
        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      },
    };
  }

  if (!authChecked) {
    return (
      <main className="cc-loading-screen">
        <div className="cc-loading-inner">
          <div className="cc-loading-logo">CC</div>
          <div className="cc-loading-spinner" />
          <p className="cc-loading-text">Loading studio…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="cc-root">

      {/* ── Top bar ── */}
      <header className="cc-topbar">
        <div className="cc-topbar-left">
          <div className="cc-logo">
            <span>CC</span>
          </div>
          <div className="cc-brand">
            <span className="cc-brand-name">CaptionCraft</span>
            <span className="cc-brand-sub">Studio</span>
          </div>
          <div className="cc-topbar-sep" />
          <label className="cc-video-picker">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>
            </svg>
            <span>Tap to choose from previous videos or upload new</span>
            <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div className="cc-topbar-right">
          <div className="cc-export-group">
            <button onClick={handleRenderVideo} disabled={!segments.length || !videoUrl || rendering} className="cc-export-btn">
              <RenderIcon />
              <span>{rendering ? "Rendering…" : "Export"}</span>
            </button>
            <div className="cc-export-divider" />
            <select value={exportResolution} onChange={(e) => setExportResolution(e.target.value as any)} className="cc-export-select">
              <option value="original">Original</option>
              {/* <option value="720p">720p</option>
              <option value="1080p">1080p</option> */}
            </select>
          </div>

          {currentUser && (
            <ProfileMenu
              user={currentUser}
              open={profileMenuOpen}
              onToggle={() => setProfileMenuOpen((v) => !v)}
              onOpenProjects={() => { setProjectsOpen(true); setProfileMenuOpen(false); }}
              onLogout={handleLogout}
            />
          )}
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="cc-layout">

        {/* ── Preview column ── */}
        <section className="cc-preview-col">
          {/* Dot-grid background pattern */}
          <div className="cc-preview-bg" aria-hidden="true" />

          <div className="cc-phone-wrap">
            {/* Glow beneath phone */}
            <div className="cc-phone-glow" />

            <div className="cc-phone-frame">
              {/* Phone notch */}
              <div className="cc-phone-notch" />

              {videoUrl ? (
                <>
                  <div className="cc-status-pill">
                    <span className="cc-status-dot" />
                    <span>Low res</span>
                    <span className="cc-status-sep">·</span>
                    <span className="cc-status-muted">Export uses original</span>
                  </div>
                  <video ref={videoRef} src={videoUrl} controls className="cc-phone-video" />
                  {/* Hidden audio elements for music preview */}
                  <audio ref={musicAudioRef} className="hidden" />
                  <audio ref={previewAudioRef} className="hidden" />
                  {activeSegment && (
  <div
    {...makePositionHandlers(segments.indexOf(activeSegment))}
    className="cc-caption-overlay"
    style={{
      fontSize: `${globalStyle.fontSize}px`,
      // background: globalStyle.background,  // ❌ REMOVE THIS LINE
      fontFamily: globalStyle.fontFamily,
      left: `${(activeSegment.position?.x ?? 0.5) * 100}%`,
      top: `${(activeSegment.position?.y ?? 0.8) * 100}%`,
      transform: "translate(-50%, -50%)",
    }}
  >
    {activeSegment.content.map((span, i) => (
      <span key={i} style={{
        color: span.color ?? globalStyle.color,
        fontWeight: span.fontWeight ?? "bold",  // Changed from "normal"
        fontFamily: (span as any).fontFamily ?? globalStyle.fontFamily,
        fontSize: (span as any).fontSize ?? globalStyle.fontSize,
        background: (span as any).background ?? "transparent",  // This becomes outline in render
        padding: "2px 4px",
        margin: "0 1px",
        borderRadius: "3px",
      }}>
        {span.text}
      </span>
    ))}
  </div>
)}
                </>
              ) : (
                <label className="cc-upload-zone">
                  <div className="cc-upload-icon-wrap">
                    <UploadIcon />
                  </div>
                  <p className="cc-upload-title">Drop a video to begin</p>
                  <p className="cc-upload-sub">MP4 · MOV · WebM</p>
                  <div className="cc-upload-browse">Browse files</div>
                  <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}

              {/* Progress overlay */}
              {uploadProgress !== null && uploadProgress < 100 && (
                <div className="cc-progress-overlay">
                  <div className="cc-progress-ring-wrap">
                    <svg width="76" height="76" viewBox="0 0 76 76">
                      <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth="4" />
                      <circle cx="38" cy="38" r="32" fill="none" stroke="url(#prog-grad)" strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - uploadProgress / 100)}`}
                        strokeLinecap="round"
                        style={{ transformOrigin: "center", transform: "rotate(-90deg)", transition: "stroke-dashoffset 0.35s ease" }}
                      />
                      <defs>
                        <linearGradient id="prog-grad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="cc-progress-pct">{Math.round(uploadProgress)}%</span>
                  </div>
                  <p className="cc-progress-label">
                    {uploadProgress < 30 ? "Uploading video…" : uploadProgress < 80 ? "Transcribing audio…" : "Finalising…"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Right panel ── */}
        <section className="cc-panel">

          {/* Panel top bar */}
          <div className="cc-panel-topbar">
            <div className="cc-tabs-pill">
              <button className={`cc-tab ${activeTab === "subtitles" ? "cc-tab-on" : ""}`} onClick={() => setActiveTab("subtitles")}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Subtitles
              </button>
              <button className={`cc-tab ${activeTab === "music" ? "cc-tab-on" : ""}`} onClick={() => setActiveTab("music")}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                Music
              </button>
            </div>

            <div className="cc-panel-controls">
              <label className="cc-autoscroll-row">
                <span className="cc-control-label">Auto-scroll</span>
                <div className="cc-toggle cc-toggle-on" />
              </label>
              <button className="cc-chip-btn" onClick={() => setSettingsOpen(true)}>
                <HighlightIcon />
                <span>Highlight</span>
              </button>
              <button className="cc-icon-btn" onClick={() => setPresetsOpen((v) => !v)} title="Settings">
                <SettingsIcon />
              </button>
            </div>
          </div>

          {/* Project row */}
          <div className="cc-project-bar">
            <div className="cc-project-title-wrap">
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Untitled project"
                className="cc-project-input"
              />
            </div>
            <div className="cc-project-actions">
              <div className="cc-project-collection-pill">
                <span className="cc-project-collection-label">Collection</span>
                <select
                  value={selectedCollectionId || ""}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    setSelectedCollectionId(val);
                  }}
                  className="cc-project-collection-select"
                >
                  <option value="">None</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={handleSaveProject} disabled={!segments.length || saving} className="cc-btn cc-btn-primary">
                <SaveIcon />
                <span>{saving ? (uploadProgress !== null ? `${Math.round(uploadProgress)}%` : "Saving…") : currentProjectId ? "Update" : "Save"}</span>
              </button>
              <button onClick={() => setProjectsOpen(true)} className="cc-btn">
                <FolderIcon /><span>Load</span>
              </button>
              <button onClick={handleDownloadSrt} disabled={!segments.length} className="cc-btn">
                <ExportIcon /><span>SRT</span>
              </button>
              {shareToken ? (
                <button onClick={handleRevokeShare} className="cc-btn cc-btn-danger">
                  <ShareIcon /><span>Revoke</span>
                </button>
              ) : (
                <button onClick={handleShareProject} disabled={!currentProjectId} className="cc-btn">
                  <ShareIcon /><span>Share</span>
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="cc-error-banner">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{error}</span>
            </div>
          )}

          {/* Subtitles list */}
          {activeTab === "subtitles" && (
            <div className="cc-subs-list">
              {loading && (
                <div className="cc-state-center">
                  <div className="cc-spin-ring" />
                  <p className="cc-state-text">Generating captions…</p>
                </div>
              )}

              {!loading && segments.length === 0 && (
                <div className="cc-empty-state">
                  <div className="cc-empty-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>
                    </svg>
                  </div>
                  <p className="cc-empty-title">No captions yet</p>
                  <p className="cc-empty-sub">Upload a video to generate your transcript</p>
                </div>
              )}

              {segments.map((s, idx) => {
                const padding = 0.15;
                const isActive = currentTime >= s.start - padding && currentTime < s.end + padding;
                const plainText = segmentToText(s);
                const words = plainText.split(" ");
                const isSegmentSelected = selectedWord.segmentIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`cc-segment ${isActive ? "cc-segment-active" : ""}`}
                    onClick={() => {
                      if (videoRef.current) { videoRef.current.currentTime = s.start; videoRef.current.play(); }
                    }}
                  >
                    {/* Active bar */}
                    {isActive && <div className="cc-segment-bar" />}

                    {/* Timestamp + controls row */}
                    <div className="cc-seg-header">
                      <div className="cc-timestamps">
                        <span className="cc-ts">{s.start.toFixed(2)}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cc-ts-arrow"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
                        <span className="cc-ts">{s.end.toFixed(2)}</span>
                      </div>
                      <div className="cc-seg-controls">
                        <button type="button" className="cc-ctrl-btn" title="Move up">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18,15 12,9 6,15"/></svg>
                        </button>
                        <button type="button" className="cc-ctrl-btn" title="Move down">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6,9 12,15 18,9"/></svg>
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleAddBelow(idx); }} className="cc-split-btn">
                          <SplitIcon /><span>Split</span>
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(idx); }} className="cc-del-btn">
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    {/* Text area */}
                    <textarea
                      value={plainText}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setSegments((prev) => {
                          const copy = [...prev];
                          copy[idx] = { ...copy[idx], content: [{ text: newText }] };
                          return copy;
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="cc-seg-textarea"
                      rows={2}
                    />

                    {/* Word chips */}
                    <div className="cc-word-chips">
                      {words.map((w, wIdx) => {
                        const isSel = selectedWord.segmentIndex === idx && selectedWord.wordIndex === wIdx;
                        return (
                          <button
                            key={wIdx}
                            type="button"
                            className={`cc-chip ${isSel ? "cc-chip-on" : ""}`}
                            onClick={(e) => { e.stopPropagation(); setSelectedWord({ segmentIndex: idx, wordIndex: wIdx }); }}
                          >
                            {w}
                          </button>
                        );
                      })}
                    </div>

                    {/* Word style panel */}
                    {isSegmentSelected && selectedWord.wordIndex !== null && (
                      <div className="cc-word-style" onClick={(e) => e.stopPropagation()}>
                        <span className="cc-word-style-label">Word Style</span>
                        <div className="cc-word-style-row">
                          <label className="cc-color-field" title="Text color">
                            <span>Text</span>
                            <input type="color" value={wordStyleDraft.color} onChange={(e) => setWordStyleDraft((p) => ({ ...p, color: e.target.value }))} className="cc-color-input" />
                          </label>
                          {/* <label className="cc-color-field" title="Background">
                            <span>Bg</span>
                            <input type="color" value={wordStyleDraft.background || "#000000"} onChange={(e) => setWordStyleDraft((p) => ({ ...p, background: e.target.value }))} className="cc-color-input" />
                          </label> */}
                          <select value={wordStyleDraft.fontFamily} onChange={(e) => setWordStyleDraft((p) => ({ ...p, fontFamily: e.target.value }))} className="cc-mini-sel">
                            <option value="Inter, system-ui, sans-serif">Inter</option>
                            <option value="Poppins, system-ui, sans-serif">Poppins</option>
                            <option value="Roboto, system-ui, sans-serif">Roboto</option>
                            <option value="Montserrat, system-ui, sans-serif">Montserrat</option>
                            <option value="Orbitron, system-ui, sans-serif">Orbitron</option>
                            <option value="Courier Prime, monospace">Courier Prime</option>
                            <option value="Playfair Display, serif">Playfair Display</option>
                            <option value="Impact, system-ui, sans-serif">Impact</option>
                          </select>
                          <input type="number" min={8} max={128} value={wordStyleDraft.fontSize} onChange={(e) => setWordStyleDraft((p) => ({ ...p, fontSize: Number(e.target.value || 36) }))} className="cc-mini-num" />
                          <button type="button" onClick={(e) => { e.stopPropagation(); setWordStyleDraft((p) => ({ ...p, bold: !p.bold })); }} className={`cc-bold-btn ${wordStyleDraft.bold ? "cc-bold-on" : ""}`}>B</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); applyWordStyle(selectedWord.segmentIndex!, selectedWord.wordIndex!); }} className="cc-apply-btn">Apply</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "music" && (
            <div className="cc-music-panel">
              <div className="cc-music-header">
                <div className="cc-music-current">
                  <div className="cc-music-pill-label">Music</div>
                  <div className="cc-music-current-main">
                    <span className="cc-music-current-label">Current</span>
                    <span className="cc-music-current-name">
                      {selectedMusic ? selectedMusic.name : "No music selected"}
                    </span>
                  </div>
                </div>
                <div className="cc-music-volume">
                  <span className="cc-music-volume-label">Music volume</span>
                  <div className="cc-music-volume-slider">
                    <span className="cc-music-volume-min">0%</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={musicVolume}
                      onChange={(e) => setMusicVolume(Number(e.target.value))}
                    />
                    <span className="cc-music-volume-max">100%</span>
                    <span className="cc-music-volume-value">{musicVolume}%</span>
                  </div>
                </div>
              </div>

              <div className="cc-music-toolbar">
                <div className="cc-music-toolbar-left">
                  <span className="cc-music-toolbar-label">Library</span>
                  <span className="cc-music-count">{MUSIC_TRACKS.length} tracks</span>
                </div>
                <input
                  type="text"
                  className="cc-music-search"
                  placeholder="Search tracks…"
                  onChange={(e) => {
                    const q = e.target.value.toLowerCase();
                    const audio = previewAudioRef.current;
                    if (audio && previewingMusicId && audio.paused) {
                      setPreviewingMusicId(null);
                    }
                    // Filter is applied inline below via includes()
                    const root = document.querySelector(".cc-music-list");
                    if (!root) return;
                    Array.from(root.children).forEach((child) => {
                      if (!(child instanceof HTMLElement)) return;
                      const text = child.dataset?.trackName?.toLowerCase() ?? "";
                      child.style.display = !q || text.includes(q) ? "" : "none";
                    });
                  }}
                />
              </div>

              <div className="cc-music-list">
                {MUSIC_TRACKS.map((track) => {
                  const isSelected = selectedMusicId === track.id;
                  const isPreviewing = previewingMusicId === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`cc-music-row ${isSelected ? "cc-music-row-on" : ""} ${
                        isPreviewing ? "cc-music-row-previewing" : ""
                      }`}
                      data-track-name={`${track.name} ${track.artist ?? ""} ${track.mood ?? ""}`}
                    >
                      <div className="cc-music-row-left">
                        <div className="cc-music-badge">
                          {isPreviewing ? (
                            <span className="cc-music-badge-dot cc-music-badge-dot-on" />
                          ) : (
                            <span className="cc-music-badge-dot" />
                          )}
                        </div>
                        <div className="cc-music-meta">
                          <div className="cc-music-title-row">
                            <span className="cc-music-title">{track.name}</span>
                            {track.durationLabel && (
                              <span className="cc-music-duration">{track.durationLabel}</span>
                            )}
                          </div>
                          <div className="cc-music-sub">
                            {track.artist && <span>{track.artist}</span>}
                            {track.mood && <span className="cc-music-dot">·</span>}
                            {track.mood && <span>{track.mood}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="cc-music-actions">
                        <button
                          type="button"
                          className={`cc-music-pill-btn ${isPreviewing ? "cc-music-pill-btn-on" : ""}`}
                          onClick={() => {
                            const audio = previewAudioRef.current;
                            if (!audio) return;
                            if (isPreviewing && !audio.paused) {
                              audio.pause();
                              audio.currentTime = 0;
                              setPreviewingMusicId(null);
                              return;
                            }
                            audio.src = track.url;
                            audio.currentTime = 0;
                            audio.volume = musicVolume / 100;
                            audio.loop = true;
                            audio
                              .play()
                              .then(() => setPreviewingMusicId(track.id))
                              .catch(() => setPreviewingMusicId(null));
                          }}
                        >
                          {isPreviewing ? "Stop" : "Preview"}
                        </button>
                        <button
                          type="button"
                          className={`cc-music-pill-btn ${
                            isSelected ? "cc-music-pill-danger" : "cc-music-pill-primary"
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMusicId(null);
                              if (musicAudioRef.current) {
                                musicAudioRef.current.pause();
                                musicAudioRef.current.currentTime = 0;
                              }
                            } else {
                              setSelectedMusicId(track.id);
                            }
                          }}
                        >
                          {isSelected ? "Unselect" : "Select"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Style footer ── */}
          <div className="cc-style-footer">
            {/* Fade-out at top of footer */}
            <div className="cc-footer-fade" />

            <div className="cc-style-tabrow">
              <button className={`cc-style-tab ${styleTab === "classic" ? "cc-style-tab-on" : ""}`} onClick={() => setStyleTab("classic")}>Classic</button>
              <button className={`cc-style-tab ${styleTab === "dynamic" ? "cc-style-tab-on" : ""}`} onClick={() => setStyleTab("dynamic")}>Dynamic</button>
              <button onClick={() => {}} className="cc-reset-btn ml-auto">Reset edits</button>
            </div>

            {/* Preset horizontal scroll */}
            <div className="cc-presets">
              {Object.entries(presetStyles).map(([name, style]) => {
                const isOn = globalStyle.preset === name;
                const bgIsGradient = typeof style.background === "string" && style.background.startsWith("linear");
                const cardBg = bgIsGradient ? "rgba(40,20,60,0.95)" : style.background;
                return (
                  <button
                    key={name}
                    onClick={() => applyGlobalPreset(name)}
                    className={`cc-preset-card ${isOn ? "cc-preset-on" : ""}`}
                    style={{ fontFamily: style.fontFamily, background: cardBg }}
                  >
                    {isOn && <div className="cc-preset-check">✓</div>}
                    <span className="cc-preset-name" style={{
                      color: style.color === "#000000" ? "#fff" : style.color,
                      textShadow: "0 1px 8px rgba(0,0,0,0.9)",
                    }}>
                      {name}
                    </span>
                    {bgIsGradient && (
                      <div className="cc-preset-gradient-pill" style={{ background: style.background }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Global controls */}
            <div className="cc-global-row">
              <label className="cc-ctrl-field">
                <span>Size</span>
                <input type="number" min={12} max={128} value={globalStyle.fontSize} onChange={(e) => setGlobalStyle((p) => ({ ...p, fontSize: Number(e.target.value || 36) }))} className="cc-mini-num" />
              </label>
              <label className="cc-ctrl-field">
                <span>Text</span>
                <input type="color" value={globalStyle.color} onChange={(e) => setGlobalStyle((p) => ({ ...p, color: e.target.value }))} className="cc-color-input" />
              </label>
              <label className="cc-ctrl-field">
                <span>Bg</span>
                <input type="color" value={globalStyle.background.slice(0, 7)} onChange={(e) => setGlobalStyle((p) => ({ ...p, background: e.target.value }))} className="cc-color-input" />
              </label>
              <label className="cc-ctrl-field">
                <span>Font</span>
                <select value={globalStyle.fontFamily} onChange={(e) => setGlobalStyle((p) => ({ ...p, fontFamily: e.target.value }))} className="cc-mini-sel">
                  <option value="Inter, system-ui, sans-serif">Inter</option>
                  <option value="Poppins, system-ui, sans-serif">Poppins</option>
                  <option value="Roboto, system-ui, sans-serif">Roboto</option>
                  <option value="Montserrat, system-ui, sans-serif">Montserrat</option>
                  <option value="Orbitron, system-ui, sans-serif">Orbitron</option>
                  <option value="Courier Prime, monospace">Courier</option>
                  <option value="Playfair Display, serif">Playfair</option>
                  <option value="Impact, system-ui, sans-serif">Impact</option>
                </select>
              </label>
            </div>

            {/* Share URL */}
            {shareUrl && (
              <div className="cc-share-row">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cc-share-icon"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <input type="text" value={shareUrl} readOnly className="cc-share-input" />
                <button onClick={() => navigator.clipboard.writeText(shareUrl)} className="cc-share-copy">Copy</button>
              </div>
            )}

            {/* Thumbnail */}
            {thumbnailUrl && (
              <div className="cc-thumb-wrap">
                <img src={thumbnailUrl} alt="Thumbnail" className="cc-thumb-img" />
                <label className="cc-thumb-overlay">
                  <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                  <span className="cc-thumb-btn">Change</span>
                </label>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Highlight Words Modal ── */}
      {settingsOpen && (
        <div className="cc-modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cc-modal-header">
              <div className="cc-modal-title-row">
                <div className="cc-modal-icon"><HighlightIcon /></div>
                <h2 className="cc-modal-title">Highlight Words</h2>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="cc-modal-close">×</button>
            </div>
            <p className="cc-modal-desc">Click words to toggle highlight. Highlighted words appear with special styling in your captions.</p>
            <div className="cc-highlight-chips">
              {segments.flatMap((s) => segmentToText(s).split(" ")).filter(Boolean).map((word, i) => (
                <button key={i} className="cc-highlight-chip">{word}</button>
              ))}
            </div>
            <div className="cc-modal-footer">
              <button onClick={() => setSettingsOpen(false)} className="cc-modal-done">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Projects Modal ── */}
      {projectsOpen && (
        <div className="cc-modal-backdrop" onClick={() => { setProjectsOpen(false); setCollectionsDropdownOpen(false); }}>
          <div className="cc-modal cc-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="cc-modal-header">
              <h2 className="cc-modal-title">Project History</h2>
              <div className="cc-modal-header-right">
                <div className="cc-collection-filter">
                  <button
                    type="button"
                    className="cc-collection-filter-btn"
                    onClick={() => setCollectionsDropdownOpen((v) => !v)}
                  >
                    <span>{collectionFilterId ? (collections.find(c => c.id === collectionFilterId)?.name || "Collection") : "All collections"}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6,9 12,15 18,9" />
                    </svg>
                  </button>
                  {collectionsDropdownOpen && (
                    <div className="cc-collection-dropdown">
                      <button
                        type="button"
                        className={`cc-collection-item ${!collectionFilterId ? "cc-collection-item-on" : ""}`}
                        onClick={() => {
                          setCollectionFilterId(null);
                          setCollectionsDropdownOpen(false);
                        }}
                      >
                        All projects
                      </button>
                      <div className="cc-collection-divider" />
                      {collectionsLoading && (
                        <div className="cc-collection-loading">Loading…</div>
                      )}
                      {!collectionsLoading && collections.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`cc-collection-item ${collectionFilterId === c.id ? "cc-collection-item-on" : ""}`}
                          onClick={() => {
                            setCollectionFilterId(c.id);
                            setCollectionsDropdownOpen(false);
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="cc-collection-new"
                        onClick={async () => {
                          const name = window.prompt("New collection name");
                          if (!name) return;
                          try {
                            const created = await createCollection({ name });
                            setCollections((prev) => [created, ...prev]);
                            setSelectedCollectionId(created.id);
                            setCollectionFilterId(created.id);
                            setCollectionsDropdownOpen(false);
                            await loadProjectsList();
                          } catch (err: any) {
                            setError(err.message ?? "Failed to create collection");
                          }
                        }}
                      >
                        + New collection
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => setProjectsOpen(false)} className="cc-modal-close">×</button>
              </div>
            </div>
            {loadingProjects ? (
              <div className="cc-state-center" style={{ minHeight: 160 }}>
                <div className="cc-spin-ring" />
              </div>
            ) : projects.length === 0 ? (
              <p className="cc-modal-empty">No projects saved yet.</p>
            ) : (
              <div className="cc-proj-list">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`cc-proj-card ${currentProjectId === project.id ? "cc-proj-card-on" : ""}`}
                    onClick={() => handleLoadProject(project.id)}
                  >
                    {project.thumbnail_url && (
                      <img src={project.thumbnail_url} alt={project.title} className="cc-proj-thumb" />
                    )}
                    <div className="cc-proj-info">
                      <p className="cc-proj-title">{project.title}</p>
                      <p className="cc-proj-meta">{project.segments.length} segments · {new Date(project.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div className="cc-proj-badges">
                      {currentProjectId === project.id && <span className="cc-proj-badge-current">Current</span>}
                      <button onClick={(e) => handleDeleteProject(project.id, e)} className="cc-proj-badge-del">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── All styles ── */}
      <style>{`
        /* ── Reset & Root ── */
        *, *::before, *::after { box-sizing: border-box; }

        .cc-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #07070b;
          color: #e2e8f0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        /* ── Loading screen ── */
        .cc-loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #07070b;
        }
        .cc-loading-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .cc-loading-logo {
          width: 48px; height: 48px;
          border-radius: 14px;
          background: radial-gradient(circle at 25% 25%, #c084fc, #6366f1);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 900; color: white;
          box-shadow: 0 0 40px rgba(168,85,247,0.4);
        }
        .cc-loading-spinner {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(168,85,247,0.15);
          border-top-color: #a855f7;
          animation: cc-spin 0.8s linear infinite;
        }
        .cc-loading-text { font-size: 13px; color: #475569; }

        /* ── Top bar ── */
        .cc-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          padding: 0 20px;
          background: rgba(7,7,11,0.96);
          border-bottom: 1px solid rgba(255,255,255,0.055);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          position: sticky;
          top: 0;
          z-index: 40;
        }
        .cc-topbar-left { display: flex; align-items: center; gap: 10px; }
        .cc-topbar-right { display: flex; align-items: center; gap: 10px; }

        .cc-logo {
          width: 34px; height: 34px;
          border-radius: 10px;
          background: radial-gradient(circle at 20% 20%, #c084fc, #6366f1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 6px 24px rgba(129,140,248,0.45);
        }
        .cc-logo span { font-size: 11px; font-weight: 900; color: white; letter-spacing: -0.5px; }

        .cc-brand { display: flex; flex-direction: column; gap: 1px; }
        .cc-brand-name { font-size: 13px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.3px; line-height: 1; }
        .cc-brand-sub { font-size: 10px; color: #4b5563; line-height: 1; letter-spacing: 0.5px; text-transform: uppercase; }

        .cc-topbar-sep { width: 1px; height: 22px; background: rgba(255,255,255,0.07); margin: 0 4px; }

        .cc-video-picker {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 13px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.025);
          cursor: pointer;
          font-size: 12px; color: #94a3b8;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .cc-video-picker:hover {
          background: rgba(168,85,247,0.07);
          border-color: rgba(168,85,247,0.25);
          color: #d8b4fe;
        }
        .cc-video-picker svg { flex-shrink: 0; opacity: 0.6; transition: opacity 0.2s; }
        .cc-video-picker:hover svg { opacity: 1; }

        .cc-export-group {
          display: flex; align-items: stretch;
          border-radius: 9px;
          overflow: hidden;
          border: 1px solid rgba(168,85,247,0.35);
          box-shadow: 0 0 20px rgba(168,85,247,0.12);
        }
        .cc-export-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 16px;
          background: linear-gradient(130deg, #7c3aed 0%, #a855f7 100%);
          color: white; font-size: 13px; font-weight: 600;
          border: none; cursor: pointer;
          transition: filter 0.18s;
          letter-spacing: -0.2px;
        }
        .cc-export-btn:hover:not(:disabled) { filter: brightness(1.12); }
        .cc-export-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .cc-export-divider { width: 1px; background: rgba(255,255,255,0.12); }
        .cc-export-select {
          padding: 7px 10px;
          background: rgba(124,58,237,0.25);
          color: #c4b5fd; font-size: 11px;
          border: none; cursor: pointer; outline: none;
          transition: background 0.15s;
        }
        .cc-export-select:hover { background: rgba(124,58,237,0.4); }

        /* ── Layout ── */
        .cc-layout {
          display: flex;
          flex: 1;
          min-height: 0;
        }

        /* ── Preview column ── */
        .cc-preview-col {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          position: relative;
          overflow: hidden;
          min-height: calc(100vh - 56px);
        }
        .cc-preview-bg {
          position: absolute; inset: 0; z-index: 0;
          background-color: rgba(0,0,0,0.5);
          background-image: radial-gradient(rgba(168,85,247,0.08) 1px, transparent 1px);
          background-size: 24px 24px;
          -webkit-mask-image: radial-gradient(ellipse 80% 80% at center, black 40%, transparent 100%);
          mask-image: radial-gradient(ellipse 80% 80% at center, black 40%, transparent 100%);
        }

        .cc-phone-wrap {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cc-phone-glow {
          position: absolute;
          width: 260px; height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%);
          bottom: -60px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
          z-index: -1;
        }

        .cc-phone-frame {
          position: relative;
          width: 304px;
          min-height: 548px;
          border-radius: 40px;
          background: #050507;
          border: 2px solid rgba(255,255,255,0.09);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.035),
            0 2px 0 rgba(255,255,255,0.06) inset,
            0 48px 120px rgba(0,0,0,0.85),
            0 0 0 6px rgba(255,255,255,0.025),
            0 0 80px rgba(168,85,247,0.07);
        }
        .cc-phone-notch {
          position: absolute;
          top: 10px; left: 50%;
          transform: translateX(-50%);
          width: 90px; height: 24px;
          background: #050507;
          border-radius: 0 0 14px 14px;
          z-index: 20;
          border: 1px solid rgba(255,255,255,0.06);
          border-top: none;
        }

        .cc-status-pill {
          position: absolute;
          top: 44px; left: 14px; z-index: 10;
          display: flex; align-items: center; gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 10px; color: #94a3b8;
        }
        .cc-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #f97316;
          box-shadow: 0 0 7px #f97316;
          animation: cc-pulse 2s ease-in-out infinite;
        }
        .cc-status-sep { color: rgba(255,255,255,0.2); }
        .cc-status-muted { color: #64748b; }

        .cc-phone-video {
          width: 100%; height: 100%;
          object-fit: cover;
          border-radius: 38px;
        }
        .cc-caption-overlay {
        pointer-events: auto;
  position: absolute;
  padding: 4px 8px;           /* Reduced from 8px 14px */
  border-radius: 0;            /* Changed from 10px - no rounded corners */
  max-width: 88%;
  text-align: center;
  cursor: move;
  font-weight: 900;            /* ADD THIS - makes text bold in preview */
  text-shadow:                 /* ADD THIS - creates outline effect in preview */
    -2px -2px 0 #000,
    2px -2px 0 #000,
    -2px 2px 0 #000,
    2px 2px 0 #000,
    -1px 0 0 #000,
    1px 0 0 #000,
    0 -1px 0 #000,
    0 1px 0 #000;
  /* REMOVE: box-shadow: 0 2px 20px rgba(0,0,0,0.8); */
}

.cc-caption-overlay span[style*="background"] {
  font-weight: 900 !important;
  /* The background color becomes the outline color in final render */
  /* In preview, we can show it as background, but render.py uses it as outline */
}


        /* Upload zone */
        .cc-upload-zone {
          display: flex; flex-direction: column; align-items: center;
          padding: 48px 28px;
          cursor: pointer; text-align: center;
          width: 100%;
        }
        .cc-upload-icon-wrap {
          width: 60px; height: 60px;
          border-radius: 18px;
          background: rgba(168,85,247,0.1);
          border: 1px solid rgba(168,85,247,0.2);
          display: flex; align-items: center; justify-content: center;
          color: #a855f7;
          transition: all 0.2s;
        }
        .cc-upload-zone:hover .cc-upload-icon-wrap {
          background: rgba(168,85,247,0.18);
          border-color: rgba(168,85,247,0.4);
          box-shadow: 0 0 20px rgba(168,85,247,0.2);
        }
        .cc-upload-title { font-size: 14px; font-weight: 600; color: #cbd5e1; margin-top: 14px; }
        .cc-upload-sub { font-size: 11px; color: #475569; margin-top: 4px; letter-spacing: 0.5px; }
        .cc-upload-browse {
          margin-top: 18px;
          padding: 9px 22px;
          border-radius: 22px;
          background: linear-gradient(130deg, #7c3aed, #a855f7);
          color: white; font-size: 12px; font-weight: 600;
          box-shadow: 0 4px 20px rgba(168,85,247,0.35);
          transition: filter 0.18s;
        }
        .cc-upload-zone:hover .cc-upload-browse { filter: brightness(1.1); }

        /* Progress */
        .cc-progress-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.88);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          border-radius: 38px;
          z-index: 20;
          backdrop-filter: blur(8px);
        }
        .cc-progress-ring-wrap {
          position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        .cc-progress-pct {
          position: absolute;
          font-size: 14px; font-weight: 800; color: #c084fc;
          letter-spacing: -0.5px;
        }
        .cc-progress-label {
          font-size: 12px; color: #94a3b8; margin-top: 14px; font-weight: 500;
        }

        /* ── Right panel ── */
        .cc-panel {
          width: 476px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: #08080d;
          border-left: 1px solid rgba(255,255,255,0.05);
          height: calc(100vh - 56px);
          overflow: hidden;
          position: relative;
        }

        /* Panel topbar */
        .cc-panel-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
          gap: 8px;
          background: rgba(255,255,255,0.01);
        }
        .cc-tabs-pill {
          display: flex;
          background: rgba(255,255,255,0.04);
          border-radius: 9px;
          padding: 3px;
          border: 1px solid rgba(255,255,255,0.04);
        }
        .cc-tab {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 12px;
          border-radius: 7px;
          font-size: 12px; font-weight: 500;
          color: #475569; cursor: pointer;
          border: none; background: none;
          transition: all 0.18s;
          letter-spacing: -0.1px;
        }
        .cc-tab:hover:not(.cc-tab-on) { color: #94a3b8; }
        .cc-tab-on {
          background: linear-gradient(130deg, #7c3aed, #a855f7);
          color: white;
          box-shadow: 0 2px 10px rgba(168,85,247,0.35);
        }

        .cc-panel-controls { display: flex; align-items: center; gap: 6px; }
        .cc-autoscroll-row { display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .cc-control-label { font-size: 11px; color: #475569; white-space: nowrap; }

        .cc-toggle {
          width: 30px; height: 17px; border-radius: 9px;
          position: relative; cursor: pointer; flex-shrink: 0;
        }
        .cc-toggle::after {
          content: '';
          position: absolute;
          width: 13px; height: 13px; border-radius: 50%;
          background: white; top: 2px; left: 15px;
          transition: left 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
        .cc-toggle-on { background: linear-gradient(130deg, #7c3aed, #a855f7); }

        .cc-chip-btn {
          display: flex; align-items: center; gap: 4px;
          padding: 5px 10px;
          border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.025);
          color: #64748b; font-size: 11px; cursor: pointer;
          transition: all 0.15s;
        }
        .cc-chip-btn:hover { background: rgba(168,85,247,0.1); border-color: rgba(168,85,247,0.3); color: #c4b5fd; }
        .cc-icon-btn {
          width: 30px; height: 30px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.025);
          color: #4b5563; cursor: pointer;
          transition: all 0.15s;
        }
        .cc-icon-btn:hover { color: #a855f7; border-color: rgba(168,85,247,0.3); background: rgba(168,85,247,0.06); }

        /* Project bar */
        .cc-project-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .cc-project-title-wrap {
          flex-basis: 100%;
          min-width: 0;
          margin-bottom: 4px;
        }
        .cc-project-input {
          width: 100%;
          background: transparent; border: none; outline: none;
          font-size: 13px; font-weight: 600;
          color: #e2e8f0;
          letter-spacing: -0.2px;
        }
        .cc-project-input::placeholder { color: #2d3748; }
        .cc-project-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          margin-left: auto;
        }
        .cc-project-collection-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(15,23,42,0.7);
        }
        .cc-project-collection-label {
          font-size: 10px;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .cc-project-collection-select {
          background: transparent;
          border: none;
          outline: none;
          color: #94a3b8;
          font-size: 11px;
        }

        .cc-btn {
          display: flex; align-items: center; gap: 4px;
          padding: 5px 10px;
          border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.025);
          color: #64748b; font-size: 11px; font-weight: 500;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .cc-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); color: #94a3b8; }
        .cc-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .cc-btn-primary {
          background: rgba(124,58,237,0.2);
          border-color: rgba(168,85,247,0.4);
          color: #c4b5fd;
        }
        .cc-btn-primary:hover:not(:disabled) { background: rgba(124,58,237,0.35); border-color: rgba(168,85,247,0.6); }
        .cc-btn-danger { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.25); color: #fca5a5; }
        .cc-btn-danger:hover { background: rgba(239,68,68,0.15) !important; }

        /* Error */
        .cc-error-banner {
          display: flex; align-items: center; gap: 7px;
          margin: 0 14px 4px;
          padding: 9px 12px;
          border-radius: 8px;
          background: rgba(127,29,29,0.35);
          border: 1px solid rgba(239,68,68,0.25);
          color: #fca5a5; font-size: 11px;
          flex-shrink: 0;
        }

        /* Subtitles list */
        .cc-subs-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 12px 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(168,85,247,0.18) transparent;
        }
        .cc-subs-list::-webkit-scrollbar { width: 4px; }
        .cc-subs-list::-webkit-scrollbar-track { background: transparent; }
        .cc-subs-list::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.2); border-radius: 4px; }

        /* Music panel */
        .cc-music-panel {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }
        .cc-music-header {
          position: sticky;
          top: 0;
          z-index: 5;
          padding: 10px 16px 8px;
          background: linear-gradient(to bottom, rgba(8,8,13,0.98), rgba(8,8,13,0.9));
          border-bottom: 1px solid rgba(255,255,255,0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .cc-music-current {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .cc-music-pill-label {
          align-self: flex-start;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #4b5563;
          padding: 2px 7px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.25);
          background: radial-gradient(circle at 0 0, rgba(168,85,247,0.25), transparent 55%);
        }
        .cc-music-current-main {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .cc-music-current-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .cc-music-current-name {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 210px;
        }
        .cc-music-volume {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .cc-music-volume-label {
          font-size: 11px;
          color: #64748b;
        }
        .cc-music-volume-slider {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cc-music-volume-slider input[type="range"] {
          flex: 1;
          accent-color: #a855f7;
        }
        .cc-music-volume-min,
        .cc-music-volume-max {
          font-size: 10px;
          color: #4b5563;
        }
        .cc-music-volume-value {
          font-size: 11px;
          color: #c4b5fd;
          font-variant-numeric: tabular-nums;
        }

        .cc-music-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 16px 6px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          gap: 8px;
          background: radial-gradient(circle at 0 0, rgba(15,23,42,0.9), rgba(15,23,42,0.4));
        }
        .cc-music-toolbar-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cc-music-toolbar-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .cc-music-count {
          font-size: 11px;
          color: #4b5563;
        }
        .cc-music-search {
          flex: 1;
          min-width: 0;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.35);
          background: radial-gradient(circle at 0 0, rgba(15,23,42,0.9), rgba(15,23,42,0.95));
          padding: 6px 11px;
          font-size: 11px;
          color: #cbd5f5;
        }
        .cc-music-search::placeholder {
          color: #4b5563;
        }

        .cc-music-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 10px 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,0.35) transparent;
        }
        .cc-music-list::-webkit-scrollbar { width: 4px; }
        .cc-music-list::-webkit-scrollbar-track { background: transparent; }
        .cc-music-list::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(129,140,248,0.7), rgba(168,85,247,0.4));
          border-radius: 999px;
        }

        .cc-music-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 7px 9px;
          border-radius: 9px;
          border: 1px solid rgba(30,41,59,0.9);
          background: radial-gradient(circle at 0 0, rgba(15,23,42,0.98), rgba(15,23,42,0.92));
          margin-bottom: 5px;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.12s;
        }
        .cc-music-row:hover {
          border-color: rgba(148,163,184,0.5);
          box-shadow: 0 8px 18px rgba(15,23,42,0.8);
          transform: translateY(-1px);
        }
        .cc-music-row-on {
          border-color: rgba(168,85,247,0.8);
          background: radial-gradient(circle at 0 0, rgba(76,29,149,0.9), rgba(15,23,42,0.95));
          box-shadow: 0 0 0 1px rgba(168,85,247,0.5), 0 10px 26px rgba(76,29,149,0.8);
        }
        .cc-music-row-previewing {
          border-color: rgba(56,189,248,0.8);
          box-shadow: 0 0 0 1px rgba(56,189,248,0.6), 0 10px 26px rgba(8,47,73,0.9);
        }

        .cc-music-row-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .cc-music-badge {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 20%, rgba(148,163,184,0.5), rgba(15,23,42,0.95));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cc-music-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(148,163,184,0.7);
        }
        .cc-music-badge-dot-on {
          background: #22c55e;
          box-shadow: 0 0 12px rgba(34,197,94,0.85);
        }
        .cc-music-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .cc-music-title-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 6px;
        }
        .cc-music-title {
          font-size: 13px;
          font-weight: 600;
          color: #e5e7eb;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cc-music-duration {
          font-size: 11px;
          color: #6b7280;
          font-variant-numeric: tabular-nums;
        }
        .cc-music-sub {
          font-size: 11px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cc-music-dot {
          color: #4b5563;
        }

        .cc-music-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cc-music-pill-btn {
          padding: 5px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.5);
          background: rgba(15,23,42,0.9);
          color: #e5e7eb;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .cc-music-pill-btn:hover {
          border-color: rgba(148,163,184,0.8);
          background: rgba(30,64,175,0.7);
        }
        .cc-music-pill-btn-on {
          border-color: rgba(56,189,248,0.8);
          background: radial-gradient(circle at 0 0, rgba(8,47,73,0.95), rgba(15,23,42,0.98));
          color: #e0f2fe;
        }
        .cc-music-pill-primary {
          border-color: rgba(168,85,247,0.8);
          background: radial-gradient(circle at 0 0, rgba(88,28,135,0.95), rgba(15,23,42,0.98));
          color: #ede9fe;
        }
        .cc-music-pill-primary:hover {
          box-shadow: 0 0 0 1px rgba(168,85,247,0.7);
        }
        .cc-music-pill-danger {
          border-color: rgba(248,113,113,0.9);
          background: radial-gradient(circle at 0 0, rgba(127,29,29,0.95), rgba(15,23,42,0.98));
          color: #fee2e2;
        }
        .cc-music-pill-danger:hover {
          box-shadow: 0 0 0 1px rgba(248,113,113,0.8);
        }

        /* States */
        .cc-state-center {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          flex: 1; padding: 40px 20px; gap: 12px;
        }
        .cc-spin-ring {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(168,85,247,0.15);
          border-top-color: #a855f7;
          animation: cc-spin 0.7s linear infinite;
        }
        .cc-state-text { font-size: 12px; color: #475569; }

        .cc-empty-state {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 60px 20px; gap: 10px;
          text-align: center;
        }
        .cc-empty-icon {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          color: #2d3748;
          margin-bottom: 4px;
        }
        .cc-empty-title { font-size: 13px; font-weight: 600; color: #4b5563; }
        .cc-empty-sub { font-size: 11px; color: #2d3748; line-height: 1.5; }

        /* Segment */
        .cc-segment {
          position: relative;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.045);
          background: rgba(255,255,255,0.015);
          padding: 10px 12px 10px 14px;
          margin-bottom: 5px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          overflow: hidden;
        }
        .cc-segment:hover {
          border-color: rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.025);
        }
        .cc-segment-active {
          border-color: rgba(168,85,247,0.4) !important;
          background: rgba(168,85,247,0.05) !important;
          box-shadow: 0 0 0 1px rgba(168,85,247,0.12) inset;
        }
        .cc-segment-bar {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, #a855f7, #6366f1);
          border-radius: 2px 0 0 2px;
        }

        .cc-seg-header {
          display: flex; align-items: center; gap: 6px;
          margin-bottom: 6px;
        }
        .cc-timestamps {
          display: flex; align-items: center; gap: 4px;
        }
        .cc-ts {
          font-size: 10px; color: #334155;
          font-variant-numeric: tabular-nums;
          font-family: "SF Mono", "Fira Code", "Consolas", monospace;
          letter-spacing: 0.3px;
        }
        .cc-ts-arrow { color: #1e293b; flex-shrink: 0; }
        .cc-segment-active .cc-ts { color: #7c3aed; }
        .cc-segment-active .cc-ts-arrow { color: rgba(124,58,237,0.5); }

        .cc-seg-controls {
          display: flex; align-items: center; gap: 3px;
          margin-left: auto;
        }
        .cc-ctrl-btn {
          width: 20px; height: 20px; border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.05);
          background: transparent; color: #2d3748; cursor: pointer;
          transition: all 0.15s;
        }
        .cc-ctrl-btn:hover { color: #64748b; border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }
        .cc-split-btn {
          display: flex; align-items: center; gap: 3px;
          padding: 3px 7px; border-radius: 5px;
          border: 1px solid rgba(255,255,255,0.06);
          background: transparent; color: #334155; font-size: 10px;
          cursor: pointer; transition: all 0.15s;
        }
        .cc-split-btn:hover { color: #64748b; border-color: rgba(255,255,255,0.12); }
        .cc-del-btn {
          width: 22px; height: 22px; border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(239,68,68,0.15);
          background: rgba(239,68,68,0.04);
          color: rgba(239,68,68,0.6); cursor: pointer;
          transition: all 0.15s;
        }
        .cc-del-btn:hover { background: rgba(239,68,68,0.14); color: #ef4444; border-color: rgba(239,68,68,0.3); }

        .cc-seg-textarea {
          width: 100%; background: transparent; border: none; outline: none;
          font-size: 13px; color: #94a3b8; resize: none; line-height: 1.55;
          font-family: inherit;
          transition: color 0.15s;
        }
        .cc-segment-active .cc-seg-textarea { color: #cbd5e1; }

        /* Word chips */
        .cc-word-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }
        .cc-chip {
          padding: 2px 7px; border-radius: 5px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          color: #2d3748; font-size: 10px; cursor: pointer;
          transition: all 0.15s; letter-spacing: 0.1px;
        }
        .cc-chip:hover { border-color: rgba(168,85,247,0.25); color: #64748b; }
        .cc-chip-on {
          border-color: rgba(168,85,247,0.5) !important;
          background: rgba(168,85,247,0.1) !important;
          color: #c4b5fd !important;
        }

        /* Word style panel */
        .cc-word-style {
          margin-top: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.055);
        }
        .cc-word-style-label {
          display: block;
          font-size: 9px; color: #334155;
          text-transform: uppercase; letter-spacing: 0.8px;
          font-weight: 600; margin-bottom: 8px;
        }
        .cc-word-style-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .cc-color-field {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          cursor: pointer;
          font-size: 9px; color: #334155; text-transform: uppercase; letter-spacing: 0.3px;
        }
        .cc-color-input {
          width: 28px; height: 20px; padding: 1px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px; cursor: pointer; overflow: hidden;
          background: none;
        }
        .cc-mini-sel {
          padding: 3px 6px; border-radius: 5px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          color: #94a3b8; font-size: 10px; outline: none;
        }
        .cc-mini-num {
          width: 44px; padding: 3px 6px; border-radius: 5px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          color: #94a3b8; font-size: 10px; outline: none; text-align: center;
        }
        .cc-bold-btn {
          padding: 3px 8px; border-radius: 5px;
          border: 1px solid rgba(255,255,255,0.07);
          background: transparent; color: #475569;
          font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.15s;
        }
        .cc-bold-on { border-color: rgba(251,191,36,0.35); color: #fbbf24; background: rgba(251,191,36,0.07); }
        .cc-apply-btn {
          padding: 3px 11px; border-radius: 5px;
          border: 1px solid rgba(168,85,247,0.35);
          background: rgba(168,85,247,0.1);
          color: #c4b5fd; font-size: 10px; cursor: pointer; transition: all 0.15s;
        }
        .cc-apply-btn:hover { background: rgba(168,85,247,0.22); }

        /* Style footer */
        .cc-style-footer {
          position: relative;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 12px 14px 14px;
          background: rgba(0,0,0,0.35);
          flex-shrink: 0;
        }
        .cc-footer-fade {
          position: absolute;
          top: -24px; left: 0; right: 0;
          height: 24px;
          background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.35));
          pointer-events: none;
        }

        .cc-style-tabrow {
          display: flex; align-items: center; gap: 4px;
          margin-bottom: 10px;
        }
        .cc-style-tab {
          padding: 4px 14px; border-radius: 20px;
          font-size: 12px; font-weight: 500; cursor: pointer;
          border: 1px solid transparent;
          color: #334155; background: none; transition: all 0.15s;
          letter-spacing: -0.1px;
        }
        .cc-style-tab-on {
          border-color: rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          color: #e2e8f0;
        }
        .cc-reset-btn {
          font-size: 11px; color: #334155; cursor: pointer;
          background: none; border: none; padding: 4px 2px;
          transition: color 0.15s;
        }
        .cc-reset-btn:hover { color: #64748b; }

        /* Preset horizontal scroll */
        .cc-presets {
          display: flex;
          flex-direction: row;
          gap: 7px;
          margin-bottom: 10px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .cc-presets::-webkit-scrollbar { display: none; }
        .cc-preset-card {
          position: relative;
          flex-shrink: 0;
          width: 96px; height: 70px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          transition: all 0.18s;
          padding: 8px 6px;
          text-align: center;
        }
        .cc-preset-card::before {
          content: '';
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.3);
          transition: background 0.15s;
        }
        .cc-preset-card:hover::before { background: rgba(0,0,0,0.1); }
        .cc-preset-card:hover { border-color: rgba(168,85,247,0.4); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.4); }
        .cc-preset-on {
          border-color: rgba(168,85,247,0.7) !important;
          box-shadow: 0 0 0 1px rgba(168,85,247,0.25), 0 4px 20px rgba(168,85,247,0.18) !important;
          transform: translateY(-1px);
        }
        .cc-preset-check {
          position: absolute; top: 5px; right: 6px;
          font-size: 9px; color: #a855f7;
          font-weight: 900; z-index: 2;
        }
        .cc-preset-name {
          position: relative; z-index: 1;
          font-size: 11px; font-weight: 800;
          line-height: 1.25;
          display: block;
          word-break: break-word;
          letter-spacing: -0.01em;
        }
        .cc-preset-gradient-pill {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 3px;
        }

        /* Global controls */
        .cc-global-row {
          display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
        }
        .cc-ctrl-field {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: #334155; cursor: pointer;
          font-weight: 500;
        }

        /* Share URL */
        .cc-share-row {
          display: flex; align-items: center; gap: 6px;
          margin-top: 8px;
          padding: 7px 10px;
          border-radius: 8px;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .cc-share-icon { color: #334155; flex-shrink: 0; }
        .cc-share-input {
          flex: 1; background: transparent; border: none; outline: none;
          font-size: 11px; color: #64748b;
          font-family: "SF Mono", "Fira Code", monospace;
        }
        .cc-share-copy {
          font-size: 11px; color: #a855f7; background: none; border: none;
          cursor: pointer; padding: 0; transition: color 0.15s; flex-shrink: 0;
        }
        .cc-share-copy:hover { color: #c4b5fd; }

        /* Thumbnail */
        .cc-thumb-wrap { position: relative; margin-top: 8px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); }
        .cc-thumb-img { width: 100%; height: 88px; object-fit: cover; display: block; }
        .cc-thumb-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.55);
          opacity: 0; transition: opacity 0.2s; cursor: pointer;
        }
        .cc-thumb-wrap:hover .cc-thumb-overlay { opacity: 1; }
        .cc-thumb-btn {
          font-size: 11px; color: white;
          padding: 5px 14px;
          background: rgba(124,58,237,0.8);
          border-radius: 20px;
          font-weight: 600;
        }

        /* ── Modals ── */
        .cc-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          z-index: 50;
        }
        .cc-modal {
          background: #0c0c12;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 24px;
          width: 480px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(168,85,247,0.08);
        }
        .cc-modal-wide { width: 560px; }
        .cc-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 4px;
        }
      .cc-modal-header-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
        .cc-modal-title-row { display: flex; align-items: center; gap: 8px; }
        .cc-modal-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(168,85,247,0.1);
          border: 1px solid rgba(168,85,247,0.2);
          display: flex; align-items: center; justify-content: center;
          color: #a855f7;
        }
        .cc-modal-title { font-size: 15px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.3px; }
        .cc-modal-close {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          color: #475569; font-size: 18px; cursor: pointer;
          transition: all 0.15s; line-height: 1;
        }
        .cc-modal-close:hover { color: #e2e8f0; background: rgba(255,255,255,0.09); }
      .cc-collection-filter {
        position: relative;
      }
      .cc-collection-filter-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 11px;
        border: 1px solid rgba(148,163,184,0.5);
        background: rgba(15,23,42,0.9);
        color: #cbd5f5;
        cursor: pointer;
      }
      .cc-collection-filter-btn svg {
        color: #64748b;
      }
      .cc-collection-dropdown {
        position: absolute;
        right: 0;
        margin-top: 6px;
        min-width: 180px;
        border-radius: 10px;
        background: #020617;
        border: 1px solid rgba(148,163,184,0.5);
        box-shadow: 0 20px 45px rgba(0,0,0,0.85);
        padding: 6px;
        z-index: 60;
      }
      .cc-collection-item,
      .cc-collection-new {
        width: 100%;
        text-align: left;
        font-size: 12px;
        padding: 5px 8px;
        border-radius: 8px;
        border: none;
        background: transparent;
        color: #e2e8f0;
        cursor: pointer;
      }
      .cc-collection-item:hover {
        background: rgba(148,163,184,0.15);
      }
      .cc-collection-item-on {
        background: rgba(79,70,229,0.25);
      }
      .cc-collection-new {
        margin-top: 4px;
        font-weight: 500;
        color: #a855f7;
      }
      .cc-collection-divider {
        height: 1px;
        margin: 4px 0;
        background: rgba(15,23,42,0.9);
      }
      .cc-collection-loading {
        font-size: 11px;
        color: #64748b;
        padding: 4px 6px;
      }
        .cc-modal-desc { font-size: 12px; color: #475569; line-height: 1.6; margin-bottom: 16px; }
        .cc-modal-empty { font-size: 13px; color: #334155; text-align: center; padding: 48px 0; }

        .cc-highlight-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .cc-highlight-chip {
          padding: 5px 12px; border-radius: 7px;
          border: 1px solid rgba(168,85,247,0.25);
          background: rgba(168,85,247,0.08);
          color: #a78bfa; font-size: 12px; cursor: pointer;
          transition: all 0.15s;
        }
        .cc-highlight-chip:hover { background: rgba(168,85,247,0.2); color: #c4b5fd; }

        .cc-modal-footer { display: flex; justify-content: flex-end; margin-top: 20px; }
        .cc-modal-done {
          padding: 8px 24px; border-radius: 8px;
          background: linear-gradient(130deg, #7c3aed, #a855f7);
          color: white; font-size: 13px; font-weight: 600;
          border: none; cursor: pointer;
          box-shadow: 0 4px 18px rgba(168,85,247,0.3);
          transition: filter 0.15s;
        }
        .cc-modal-done:hover { filter: brightness(1.1); }

        /* Project list */
        .cc-proj-list { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; max-height: 60vh; overflow-y: auto; }
        .cc-proj-card {
          display: flex; align-items: center; gap: 12px;
          padding: 12px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.015);
          cursor: pointer; transition: all 0.15s;
        }
        .cc-proj-card:hover { border-color: rgba(255,255,255,0.09); background: rgba(255,255,255,0.03); }
        .cc-proj-card-on { border-color: rgba(168,85,247,0.45) !important; background: rgba(168,85,247,0.06) !important; }
        .cc-proj-thumb { width: 72px; height: 52px; object-fit: cover; border-radius: 7px; border: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
        .cc-proj-info { flex: 1; min-width: 0; }
        .cc-proj-title { font-size: 13px; font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.2px; }
        .cc-proj-meta { font-size: 11px; color: #334155; margin-top: 2px; }
        .cc-proj-badges { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .cc-proj-badge-current { font-size: 10px; color: #a855f7; border: 1px solid rgba(168,85,247,0.35); padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
        .cc-proj-badge-del { font-size: 10px; color: #f87171; border: 1px solid rgba(239,68,68,0.25); padding: 2px 8px; border-radius: 20px; background: rgba(239,68,68,0.06); cursor: pointer; transition: all 0.15s; }
        .cc-proj-badge-del:hover { background: rgba(239,68,68,0.14); }

        /* ── Animations ── */
        @keyframes cc-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes cc-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </main>
  );
}

// ── Profile Menu ──────────────────────────────────────────────────────────────
type ProfileMenuProps = {
  user: AuthUser;
  open: boolean;
  onToggle: () => void;
  onOpenProjects: () => void;
  onLogout: () => void;
};

function ProfileMenu({ user, open, onToggle, onOpenProjects, onLogout }: ProfileMenuProps) {
  const initials = user.name.split(" ").map((p) => p[0]?.toUpperCase()).slice(0, 2).join("") || "U";
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="cc-avatar"
        style={{
          background: "radial-gradient(circle at 30% 30%, #c084fc, #6366f1)",
          boxShadow: "0 0 0 2px rgba(168,85,247,0.25), 0 4px 16px rgba(168,85,247,0.25)",
        }}
      >
        {initials}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="cc-profile-menu">
            <div className="cc-profile-header">
              <div className="cc-profile-name">{user.name}</div>
              <div className="cc-profile-email">{user.email}</div>
            </div>
            <button onClick={onOpenProjects} className="cc-profile-item">
              <span>Your projects</span>
              <span className="cc-profile-shortcut">⌘P</span>
            </button>
            <button onClick={onLogout} className="cc-profile-item cc-profile-logout">
              Logout
            </button>
          </div>
        </>
      )}
      <style>{`
        .cc-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          font-size: 12px; font-weight: 800; color: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; border: none; transition: all 0.2s; letter-spacing: -0.5px;
        }
        .cc-avatar:hover { transform: scale(1.06); }
        .cc-profile-menu {
          position: absolute; right: 0; top: calc(100% + 8px);
          width: 210px; border-radius: 12px;
          background: #0c0c12;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,85,247,0.06);
          overflow: hidden;
          z-index: 50;
        }
        .cc-profile-header {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.055);
        }
        .cc-profile-name { font-size: 13px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.2px; }
        .cc-profile-email { font-size: 11px; color: #334155; margin-top: 2px; }
        .cc-profile-item {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; text-align: left;
          padding: 10px 16px;
          font-size: 13px; color: #94a3b8;
          background: none; border: none; cursor: pointer;
          transition: background 0.15s;
        }
        .cc-profile-item:hover { background: rgba(255,255,255,0.04); }
        .cc-profile-shortcut { font-size: 10px; color: #2d3748; }
        .cc-profile-logout { color: #f87171; }
        .cc-profile-logout:hover { background: rgba(239,68,68,0.06) !important; }
      `}</style>
    </div>
  );
}