/**
 * POST /api/v1/admin/uploads/sign
 *
 * Issues a Supabase Storage signed-upload token so the browser uploads
 * directly to storage — the file never passes through this server. This
 * matters on Vercel, where request bodies are capped (~4.5MB): the legacy
 * multipart route breaks for larger files, this route has no size ceiling
 * beyond the bucket limits below.
 *
 * Body: { kind: "image" | "file", filename: string, sizeBytes: number, folder?: string }
 * Response: { bucket, path, token, publicUrl }
 *
 * The client completes the upload with
 * supabase.storage.from(bucket).uploadToSignedUrl(path, token, file).
 */
import { randomUUID } from "node:crypto";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const KINDS = {
  image: {
    bucket: "cms-images",
    maxBytes: 25 * 1024 * 1024,
    extensions: new Set(["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"]),
  },
  file: {
    bucket: "cms-files",
    maxBytes: 200 * 1024 * 1024,
    // Course/resource assets: documents, archives, design files, captions, audio.
    // Video files are deliberately excluded — those go to Cloudflare Stream.
    extensions: new Set([
      "pdf", "zip", "txt", "md", "csv", "srt", "vtt",
      "3dm", "gh", "ghx", "dyn", "dwg", "dxf", "skp", "blend", "obj", "fbx", "stl", "ifc", "usdz", "glb", "gltf",
      "psd", "ai", "indd", "aep", "prproj",
      "pptx", "docx", "xlsx", "key",
      "mp3", "wav", "aac",
      // Images are valid resource files too (diagrams, worksheets)
      "jpg", "jpeg", "png", "webp", "gif", "svg", "avif",
    ]),
  },
} as const;

async function ensureBucket(bucket: string, maxBytes: number) {
  const db = createSupabaseServiceClient();
  const { data: buckets, error: listError } = await db.storage.listBuckets();
  if (listError) throw new Error(listError.message);
  if (!buckets.some((b) => b.name === bucket)) {
    const { error } = await db.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: maxBytes,
    });
    if (error && !/already exists/i.test(error.message)) throw new Error(error.message);
  }
  return db;
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  let body: { kind?: unknown; filename?: unknown; sizeBytes?: unknown; folder?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const kind = body.kind === "file" ? "file" : body.kind === "image" ? "image" : null;
  if (!kind) return errorResponse('kind must be "image" or "file".', 400);
  const config = KINDS[kind];

  const filename = typeof body.filename === "string" ? body.filename.trim() : "";
  const sizeBytes = typeof body.sizeBytes === "number" && Number.isFinite(body.sizeBytes) ? body.sizeBytes : 0;
  if (!filename) return errorResponse("filename is required.", 400);
  if (sizeBytes <= 0) return errorResponse("sizeBytes is required.", 400);
  if (sizeBytes > config.maxBytes) {
    return errorResponse(`File is too large — the limit is ${Math.round(config.maxBytes / 1024 / 1024)}MB.`, 400);
  }

  const extension = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  if (!config.extensions.has(extension)) {
    return errorResponse(`.${extension || "?"} files are not supported for ${kind} uploads.`, 400);
  }

  const folderRaw = typeof body.folder === "string" ? body.folder : "general";
  const folder = folderRaw.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-|-$/g, "") || "general";

  // Keep a readable slug from the original name so downloads look sane.
  const base = filename.replace(/\.[^.]*$/, "").toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "upload";
  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${base}-${randomUUID().slice(0, 8)}.${extension}`;

  try {
    const db = await ensureBucket(config.bucket, config.maxBytes);
    const { data, error } = await db.storage.from(config.bucket).createSignedUploadUrl(path);
    if (error || !data) return errorResponse(error?.message ?? "Could not create signed upload.", 500);

    const { data: pub } = db.storage.from(config.bucket).getPublicUrl(path);
    return okResponse({
      bucket: config.bucket,
      path,
      token: data.token,
      publicUrl: pub.publicUrl,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Could not sign upload.", 500);
  }
}
