"use client";

import { useRef, useState } from "react";
import { uploadViaSignedUrl, type UploadKind } from "@/lib/upload-client";

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif";
const FILE_ACCEPT = ".pdf,.zip,.txt,.md,.csv,.srt,.vtt,.3dm,.gh,.ghx,.dyn,.dwg,.dxf,.skp,.blend,.obj,.fbx,.stl,.ifc,.usdz,.glb,.gltf,.psd,.ai,.indd,.aep,.prproj,.pptx,.docx,.xlsx,.key,.mp3,.wav,.aac,image/*";

export function ImageUploadField({
  accessToken,
  value,
  onChange,
  label = "Image",
  folder = "general",
  placeholder = "https://...",
  kind = "image",
}: {
  accessToken: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  folder?: string;
  placeholder?: string;
  /** "image" for artwork fields; "file" also accepts documents and design files */
  kind?: UploadKind;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      // Direct-to-storage: not subject to the serverless body cap, so large
      // PDFs/design files work and images above ~4MB stop failing on Vercel.
      const { url } = await uploadViaSignedUrl(accessToken, file, { kind, folder });
      onChange(url);
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
          accept={kind === "file" ? FILE_ACCEPT : IMAGE_ACCEPT}
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
