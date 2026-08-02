"use client";

/**
 * VideoUploadField
 *
 * Replaces the plain "Video URL" text input in the lesson editor.
 * Supports two modes:
 *   1. Upload — drops or picks a video file, uploads directly to Cloudflare Stream
 *      via TUS protocol (file never passes through the server).
 *   2. URL  — paste a YouTube / Vimeo / external URL directly.
 *
 * Props:
 *   accessToken  — admin bearer token
 *   videoId      — stored Cloudflare video UID (empty if not yet uploaded)
 *   videoUrl     — stored external/YouTube URL (empty if using CF)
 *   onVideoId    — called when a CF upload completes with the new videoId
 *   onVideoUrl   — called when the URL tab value changes
 */

import { useEffect, useRef, useState } from "react";
import type { Upload as TusUpload } from "tus-js-client";

// ── Types ────────────────────────────────────────────────────────────────────

type UploadPhase =
  | "idle"          // nothing happening
  | "uploading"     // TUS upload in progress
  | "processing"    // file uploaded; CF is transcoding
  | "ready"         // CF video is ready for playback
  | "error";        // something went wrong

type VideoDetails = {
  videoId: string;
  status: string;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  ready: boolean;
};

// ── Icons ────────────────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="10" opacity="0.15" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="vuf-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

// ── Component ────────────────────────────────────────────────────────────────

export function VideoUploadField({
  accessToken,
  videoId = "",
  videoUrl = "",
  onVideoId,
  onVideoUrl,
}: {
  accessToken: string;
  videoId?: string;
  videoUrl?: string;
  onVideoId: (id: string) => void;
  onVideoUrl: (url: string) => void;
}) {
  const [tab, setTab] = useState<"upload" | "url">(videoId ? "upload" : videoUrl ? "url" : "upload");
  const [phase, setPhase] = useState<UploadPhase>(videoId ? "ready" : "idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<VideoDetails | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const tusRef = useRef<TusUpload | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load details for an existing CF video on mount ─────────────────────
  useEffect(() => {
    if (!videoId) return;
    setPhase("ready");
    void fetchDetails(videoId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tusRef.current?.abort();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function fetchDetails(id: string) {
    try {
      const res = await fetch(`/api/v1/admin/upload-video/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const d = (await res.json()) as VideoDetails;
      setDetails(d);
      if (d.ready) setPhase("ready");
    } catch {
      // non-fatal — details are cosmetic
    }
  }

  function startPolling(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    setPhase("processing");

    pollRef.current = setInterval(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/v1/admin/upload-video/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) return;
          const d = (await res.json()) as VideoDetails;
          setDetails(d);
          if (d.ready || d.status === "ready") {
            setPhase("ready");
            clearInterval(pollRef.current!);
            pollRef.current = null;
          }
          if (d.status === "error") {
            setPhase("error");
            setError("Video processing failed. Please try uploading again.");
            clearInterval(pollRef.current!);
            pollRef.current = null;
          }
        } catch {
          // continue polling
        }
      })();
    }, 3000);
  }

  async function startUpload(file: File) {
    if (file.size > 2 * 1024 * 1024 * 1024) {
      setError("Video must be smaller than 2GB.");
      return;
    }

    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/mpeg", "video/ogg"];
    if (!allowedTypes.some((t) => file.type === t || file.type.startsWith("video/"))) {
      setError("Please upload a video file (MP4, WebM, MOV, etc.).");
      return;
    }

    setError("");
    setPhase("uploading");
    setProgress(0);

    try {
      // Resume support: if this exact file was mid-upload recently (tab
      // closed, connection dropped), reuse its upload URL — TUS continues
      // from the last confirmed byte instead of starting over.
      const fingerprint = `vuf/${file.name}/${file.size}/${file.lastModified}`;
      let uploadUrl = "";
      let newVideoId = "";
      try {
        const stored = JSON.parse(window.localStorage.getItem(fingerprint) ?? "null") as
          | { uploadUrl: string; videoId: string; createdAt: number }
          | null;
        // Direct-upload URLs are valid for 6 hours; leave a safety margin.
        if (stored && Date.now() - stored.createdAt < 5.5 * 60 * 60 * 1000) {
          uploadUrl = stored.uploadUrl;
          newVideoId = stored.videoId;
        }
      } catch {
        // corrupt entry — ignore
      }

      if (!uploadUrl) {
        // 1 — Ask our server for a one-time CF Stream upload URL
        const slotRes = await fetch("/api/v1/admin/upload-video", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!slotRes.ok) {
          const msg = (await slotRes.json() as { error?: string }).error ?? "Could not create upload slot.";
          throw new Error(msg);
        }
        ({ uploadUrl, videoId: newVideoId } = (await slotRes.json()) as { uploadUrl: string; videoId: string });
        try {
          window.localStorage.setItem(fingerprint, JSON.stringify({ uploadUrl, videoId: newVideoId, createdAt: Date.now() }));
        } catch {
          // storage full/blocked — resume just won't be available
        }
      }

      // Store the video ID immediately so the lesson record holds it even if the
      // user navigates away before transcoding completes.
      onVideoId(newVideoId);

      // 2 — TUS upload directly from the browser to Cloudflare (file bypasses server)
      const { Upload } = await import("tus-js-client");
      const upload = new Upload(file, {
        uploadUrl,
        chunkSize: 50 * 1024 * 1024, // 50 MB chunks
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onProgress(bytesUploaded, bytesTotal) {
          setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
        },
        onSuccess() {
          try { window.localStorage.removeItem(fingerprint); } catch { /* noop */ }
          startPolling(newVideoId);
        },
        onError(err) {
          setPhase("error");
          setError(err.message ?? "Upload failed.");
        },
      });

      tusRef.current = upload;
      upload.start();
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void startUpload(file);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void startUpload(file);
  }

  function cancelUpload() {
    tusRef.current?.abort();
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setPhase("idle");
    setProgress(0);
    setError("");
  }

  function replaceVideo() {
    setPhase("idle");
    setProgress(0);
    setError("");
    setDetails(null);
    onVideoId("");
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="vuf-root">
      {/* ── Tab switcher ── */}
      <div className="vuf-tabs">
        <button
          type="button"
          className={`vuf-tab${tab === "upload" ? " is-active" : ""}`}
          onClick={() => setTab("upload")}
        >
          <UploadIcon /> Upload
        </button>
        <button
          type="button"
          className={`vuf-tab${tab === "url" ? " is-active" : ""}`}
          onClick={() => setTab("url")}
        >
          <LinkIcon /> Paste URL
        </button>
      </div>

      {/* ── Upload tab ── */}
      {tab === "upload" && (
        <>
          {/* IDLE — drop zone */}
          {phase === "idle" && (
            <div
              className={`vuf-dropzone${dragging ? " is-dragging" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label="Drop video file or click to choose"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
            >
              <UploadIcon />
              <span className="vuf-dropzone-main">Drop video here or <u>browse</u></span>
              <span className="vuf-dropzone-sub">MP4, WebM, MOV · up to 2 GB</span>
            </div>
          )}

          {/* UPLOADING — progress */}
          {phase === "uploading" && (
            <div className="vuf-progress-wrap">
              <div className="vuf-progress-row">
                <span className="vuf-progress-label">Uploading to Cloudflare…</span>
                <span className="vuf-progress-pct">{progress}%</span>
              </div>
              <div className="vuf-progress-bar">
                <div className="vuf-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <button type="button" className="vuf-cancel-btn" onClick={cancelUpload}>Cancel</button>
            </div>
          )}

          {/* PROCESSING — transcoding spinner */}
          {phase === "processing" && (
            <div className="vuf-status-card">
              <SpinnerIcon />
              <div>
                <strong>Transcoding…</strong>
                <span>Usually takes 1–2 minutes</span>
              </div>
            </div>
          )}

          {/* READY — thumbnail + metadata */}
          {phase === "ready" && (
            <div className="vuf-ready-card">
              {details?.thumbnailUrl ? (
                <div className="vuf-thumb-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={details.thumbnailUrl} alt="Video thumbnail" className="vuf-thumb" />
                  <span className="vuf-play-overlay"><PlayIcon /></span>
                </div>
              ) : (
                <div className="vuf-thumb-placeholder"><PlayIcon /></div>
              )}
              <div className="vuf-ready-meta">
                <strong className="vuf-ready-title">
                  {details?.ready ? "Ready to stream" : "Processing…"}
                </strong>
                {details?.durationSeconds != null && (
                  <span className="vuf-ready-duration">{formatDuration(details.durationSeconds)}</span>
                )}
                <span className="vuf-ready-id">ID: {videoId}</span>
              </div>
              <button type="button" className="vuf-replace-btn" onClick={replaceVideo} title="Replace video">
                Replace
              </button>
            </div>
          )}

          {/* ERROR */}
          {phase === "error" && (
            <div className="vuf-error-wrap">
              <p className="vuf-error-msg">{error}</p>
              <button type="button" className="st-create-btn" onClick={() => { setPhase("idle"); setError(""); }}>
                Try again
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="vuf-file-input"
            onChange={handleFileChange}
          />
        </>
      )}

      {/* ── URL tab ── */}
      {tab === "url" && (
        <div className="vuf-url-wrap">
          <input
            type="url"
            className="vuf-url-input"
            value={videoUrl}
            onChange={(e) => onVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=… or https://vimeo.com/…"
          />
          {videoUrl && isExternalUrl(videoUrl) && (
            <p className="vuf-url-hint">
              External video URL saved. For private / gated lessons, upload to Cloudflare instead.
            </p>
          )}
        </div>
      )}

      {/* Inline error (non-upload-phase) */}
      {error && phase !== "error" && (
        <p className="vuf-error-msg">{error}</p>
      )}
    </div>
  );
}
