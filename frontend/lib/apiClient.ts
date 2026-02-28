// frontend/lib/apiClient.ts
export const API_BASE = "http://localhost:8000/api";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("cc_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type StyledSpan = {
  text: string;
  color?: string;
  fontWeight?: "normal" | "bold";
  underline?: boolean;
  fontFamily?: string;
  fontSize?: number;
  background?: string;
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
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    throw new Error(`Transcription failed: ${res.status}`);
  }

  return (await res.json()) as { segments: RawSegment[] };
}

// UPDATED: Now accepts {segments, globalStyle, videoUrl, resolution, musicUrl?, musicVolume?}
export async function renderVideo(
  renderData: { 
    segments: Segment[]; 
    globalStyle: GlobalStyle; 
    videoUrl: string;
    resolution?: "original" | "720p" | "1080p";
    musicUrl?: string;
    musicVolume?: number; // 0–1
  }
): Promise<{ file_name: string; thumbnail_path?: string; output_resolution?: string }> {
  const formData = new FormData();
  const videoBlob = await fetch(renderData.videoUrl).then((r) => r.blob());
  formData.append("video", videoBlob, "input.mp4");
  formData.append("segments", JSON.stringify(renderData.segments));
  formData.append("globalStyle", JSON.stringify(renderData.globalStyle));
  formData.append("resolution", renderData.resolution || "original");

  if (renderData.musicUrl) {
    formData.append("music_url", renderData.musicUrl);
    formData.append("music_volume", String(renderData.musicVolume ?? 0.3));
  }

  const res = await fetch(`${API_BASE}/render`, {
    method: "POST",
    body: formData,
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) throw new Error("Render failed");
  return res.json() as Promise<{ file_name: string; thumbnail_path?: string; output_resolution?: string }>;
}

export async function downloadRenderedVideo(fileName: string) {
  const url = `${API_BASE}/render/download/${encodeURIComponent(fileName)}`;
  const res = await fetch(url, { headers: { ...getAuthHeaders() } });
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

// ==================== Video Upload Functions ====================

export type VideoUploadResponse = {
  video_url: string;
  public_id: string;
  resource_type: string;
  duration?: number;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  thumbnail_url?: string;
};

/**
 * Upload a video file to Cloudinary
 * @param file The video file to upload
 * @param generateThumbnail Whether to auto-generate thumbnail (default: true)
 * @param onProgress Optional progress callback (0-100)
 * @returns Cloudinary upload response with video_url and thumbnail_url
 */
export async function uploadVideo(
  file: File,
  generateThumbnail: boolean = true,
  onProgress?: (progress: number) => void
): Promise<VideoUploadResponse> {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("generate_thumbnail", generateThumbnail.toString());

  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (onProgress) onProgress(100);
          resolve(response);
        } catch (e) {
          reject(new Error("Failed to parse response"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.detail || "Upload failed"));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted"));
    });

    const token = localStorage.getItem("cc_token");
    xhr.open("POST", `${API_BASE}/upload/video`);
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

/**
 * Upload a custom thumbnail image
 * @param file The image file to upload (jpg, png, webp)
 * @returns Cloudinary URL of uploaded thumbnail
 */
export async function uploadThumbnail(file: File): Promise<{ thumbnail_url: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE}/upload/thumbnail`, {
    method: "POST",
    body: formData,
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(error.detail || "Failed to upload thumbnail");
  }

  return res.json();
}

// ==================== Project API Functions ====================

export type Project = {
  id: string;
  title: string;
  user_id?: string | null;
  video_filename?: string | null;
  video_url?: string | null;
  segments: Segment[];
  global_style?: GlobalStyle | null;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string | null;
  share_token?: string | null;
  is_public?: boolean;
  collection_id?: string | null;
};

export type ProjectCreate = {
  title: string;
  user_id?: string | null;
  video_filename?: string | null;
  video_url?: string | null;
  segments: Segment[];
  global_style?: GlobalStyle | null;
  thumbnail_url?: string | null;
  collection_id?: string | null;
};

export type ProjectUpdate = {
  title?: string;
  segments?: Segment[];
  global_style?: GlobalStyle | null;
  video_filename?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
   // To move project between collections or clear it
  collection_id?: string | null;
};

// Save a new project
export async function saveProject(project: ProjectCreate): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(project),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to save project" }));
    throw new Error(error.detail || "Failed to save project");
  }

  return res.json();
}

// Update an existing project
export async function updateProject(projectId: string, update: ProjectUpdate): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(update),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to update project" }));
    throw new Error(error.detail || "Failed to update project");
  }

  return res.json();
}

// Load a specific project
export async function loadProject(projectId: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, { headers: { ...getAuthHeaders() } });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Project not found" }));
    throw new Error(error.detail || "Project not found");
  }

  return res.json();
}

// List all projects, optionally filtered by collection
export async function listProjects(collectionId?: string): Promise<Project[]> {
  const url = collectionId
    ? `${API_BASE}/projects?collection_id=${encodeURIComponent(collectionId)}`
    : `${API_BASE}/projects`;

  const res = await fetch(url, { headers: { ...getAuthHeaders() } });

  if (!res.ok) {
    throw new Error("Failed to load projects");
  }

  return res.json();
}

// Delete a project
export async function deleteProject(projectId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    throw new Error("Failed to delete project");
  }
}

// ==================== Project Sharing Functions ====================

export type ShareTokenResponse = {
  share_token: string;
  share_url: string;
};

/**
 * Generate or regenerate share token for a project
 */
export async function generateShareToken(projectId: string): Promise<ShareTokenResponse> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/share`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to generate share token" }));
    throw new Error(error.detail || "Failed to generate share token");
  }

  return res.json();
}

/**
 * Get a shared project by share token (no authentication required)
 */
export async function getSharedProject(shareToken: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/shared/${shareToken}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Invalid share link" }));
    throw new Error(error.detail || "Invalid share link");
  }

  return res.json();
}

/**
 * Revoke share token for a project
 */
export async function revokeShareToken(projectId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/share`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    throw new Error("Failed to revoke share token");
  }
}

// ==================== Collection Functions ====================

export type Collection = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type CollectionCreate = {
  name: string;
};

export type CollectionUpdate = {
  name?: string;
};

export async function listCollections(): Promise<Collection[]> {
  const res = await fetch(`${API_BASE}/collections`, {
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    throw new Error("Failed to load collections");
  }

  return res.json();
}

export async function createCollection(
  data: CollectionCreate
): Promise<Collection> {
  const res = await fetch(`${API_BASE}/collections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Failed to create collection" }));
    throw new Error(error.detail || "Failed to create collection");
  }

  return res.json();
}