import { randomUUID } from "node:crypto";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { validateUploadMime, validateSvgContent } from "@/server/upload/validate-mime";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const BUCKET = "cms-images";
// Serverless platforms cap request bodies around 4.5MB — larger uploads must
// use the signed direct-to-storage flow (/api/v1/admin/uploads/sign), which
// the studio fields now do by default. This multipart route stays for
// backwards compatibility with small images only.
const MAX_BYTES = 4 * 1024 * 1024;
// Magic-byte-validatable types (JPEG, PNG, WebP, GIF)
const BINARY_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_TYPES = new Set([...BINARY_IMAGE_TYPES, "image/svg+xml"]);

function extensionFor(mime: string, file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(fromName)) return fromName;
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
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
    if (file.size > MAX_BYTES) {
      return errorResponse("Image is larger than 4MB — the studio's direct upload handles this automatically; refresh the studio and try again.", 400);
    }

    // Read bytes first so we can validate content, not just the client header
    const bytes = Buffer.from(await file.arrayBuffer());

    // Determine MIME type by content, not client-supplied file.type
    let validatedMime: string;
    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      // SVG is text-based — no magic bytes; validate content instead
      const svgCheck = validateSvgContent(bytes);
      if (!svgCheck.ok) return errorResponse(svgCheck.error, 400);
      validatedMime = svgCheck.mime;
    } else {
      const mimeCheck = validateUploadMime(bytes, BINARY_IMAGE_TYPES);
      if (!mimeCheck.ok) return errorResponse(mimeCheck.error, 400);
      validatedMime = mimeCheck.mime;
    }

    const safeFolder = folder.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-|-$/g, "") || "general";
    const objectPath = `${safeFolder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extensionFor(validatedMime, file)}`;
    const db = await ensureBucket();

    const { error } = await db.storage.from(BUCKET).upload(objectPath, bytes, {
      cacheControl: "31536000",
      contentType: validatedMime, // use validated MIME, not client-supplied file.type
      upsert: false,
    });
    if (error) return errorResponse(error.message, 500);

    const { data } = db.storage.from(BUCKET).getPublicUrl(objectPath);
    return okResponse({ url: data.publicUrl, path: objectPath });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Upload failed.", 500);
  }
}
