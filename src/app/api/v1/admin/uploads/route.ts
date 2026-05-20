import { randomUUID } from "node:crypto";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const BUCKET = "cms-images";
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "image/svg+xml") return "svg";
  return "bin";
}

async function ensureBucket() {
  const db = createSupabaseServiceClient();
  const { data: buckets, error: listError } = await db.storage.listBuckets();
  if (listError) throw new Error(listError.message);
  if (buckets.some((bucket) => bucket.name === BUCKET)) return db;

  const { error } = await db.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  });
  if (error && !/already exists/i.test(error.message)) throw new Error(error.message);
  return db;
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder = typeof form.get("folder") === "string" ? String(form.get("folder")) : "general";

    if (!(file instanceof File)) return errorResponse("Image file is required.", 400);
    if (!ALLOWED_TYPES.has(file.type)) return errorResponse("Upload a JPG, PNG, WebP, GIF, or SVG image.", 400);
    if (file.size > MAX_BYTES) return errorResponse("Image must be smaller than 8MB.", 400);

    const safeFolder = folder.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-|-$/g, "") || "general";
    const objectPath = `${safeFolder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extensionFor(file)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const db = await ensureBucket();

    const { error } = await db.storage.from(BUCKET).upload(objectPath, bytes, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
    if (error) return errorResponse(error.message, 500);

    const { data } = db.storage.from(BUCKET).getPublicUrl(objectPath);
    return okResponse({ url: data.publicUrl, path: objectPath });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Upload failed.", 500);
  }
}
