import { randomUUID } from "node:crypto";
import { errorResponse, okResponse } from "@/lib/http";
import { consumeRateLimit } from "@/server/rate-limit";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import { requireUserFromRequest } from "@/server/auth/require-user";
import { validateUploadMime } from "@/server/upload/validate-mime";

const BUCKET = "student-evidence";
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName && ["jpg", "jpeg", "png", "webp", "pdf"].includes(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "application/pdf") return "pdf";
  return "bin";
}

async function ensureBucket() {
  const db = createSupabaseServiceClient();
  const { data: buckets, error: listError } = await db.storage.listBuckets();
  if (listError) throw new Error(listError.message);
  if (buckets.some((bucket) => bucket.name === BUCKET)) return db;

  const { error } = await db.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  });
  if (error && !/already exists/i.test(error.message)) throw new Error(error.message);
  return db;
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const db = createSupabaseServiceClient();
    const ip = getClientIp(request);
    const limit = await consumeRateLimit(db, {
      key: `student-evidence:${ip}`,
      max: 8,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.ok) {
      const response = errorResponse("Too many uploads. Try again later.", 429, {
        retryAfterSeconds: limit.retryAfterSeconds,
      });
      response.headers.set("Retry-After", String(limit.retryAfterSeconds));
      return response;
    }

    const form = await request.formData();
    const file = form.get("file");
    const email = typeof form.get("email") === "string" ? String(form.get("email")).trim().toLowerCase() : "";

    if (!(file instanceof File)) return errorResponse("Student evidence file is required.", 400);
    if (!email || !email.includes("@")) return errorResponse("A valid email is required.", 400);
    if (file.size > MAX_BYTES) return errorResponse("Evidence must be smaller than 8MB.", 400);

    const bytes = Buffer.from(await file.arrayBuffer());
    // Validate by magic bytes — never trust the client-supplied Content-Type
    const mimeCheck = validateUploadMime(bytes, ALLOWED_TYPES);
    if (!mimeCheck.ok) return errorResponse(mimeCheck.error, 400);

    const safeEmail = email.replace(/[^a-z0-9@._-]/g, "").replace("@", "-at-").slice(0, 120);
    const objectPath = `pending/${safeEmail}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extensionFor(file)}`;
    const storageDb = await ensureBucket();

    const { error } = await storageDb.storage.from(BUCKET).upload(objectPath, bytes, {
      cacheControl: "31536000",
      contentType: mimeCheck.mime, // use validated MIME, not client-supplied file.type
      upsert: false,
    });
    if (error) return errorResponse(error.message, 500);

    return okResponse({ path: objectPath, filename: file.name });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Upload failed.", 500);
  }
}
