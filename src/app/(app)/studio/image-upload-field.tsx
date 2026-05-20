"use client";

import { useRef, useState } from "react";

type UploadResponse = {
  url: string;
  path: string;
};

export function ImageUploadField({
  accessToken,
  value,
  onChange,
  label = "Image",
  folder = "general",
  placeholder = "https://...",
}: {
  accessToken: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  folder?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("folder", folder);
      const response = await fetch("/api/v1/admin/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      if (!response.ok) throw new Error(await response.text());
      const payload = (await response.json()) as UploadResponse;
      onChange(payload.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="st-field">
      <span>{label}</span>
      <div className="st-upload-row">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="st-upload-native"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <button type="button" className="st-create-btn" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {error ? <p className="st-field-help st-field-help--error">{error}</p> : null}
      {value ? (
        <div className="st-preview-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="preview" />
        </div>
      ) : null}
    </div>
  );
}
