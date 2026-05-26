import { randomUUID } from "node:crypto";
import { errorResponse, okResponse } from "@/lib/http";
import { consumeRateLimit } from "@/server/rate-limit";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import { requireUserFromRequest } from "@/server/auth/require-user";
import { validateUploadMime } from "@/server/upload/validate-mime";

const BUCKET = "student-evidence";
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const AI_CONFIDENCE_THRESHOLD = 0.80;

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName && ["jpg", "jpeg", "png", "webp", "pdf"].includes(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "application/pdf") return "pdf";
  return "bin";
}

type VerifyResult = {
  isStudent: boolean;
  confidence: number;
  institution: string;
  documentType: string;
  reason: string;
};

async function verifyWithAI(fileBytes: Buffer, mimeType: string): Promise<VerifyResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("AI verification is not configured.");

  // For PDFs we can't send as vision — treat as pending with low confidence
  if (mimeType === "application/pdf") {
    return {
      isStudent: false,
      confidence: 0.5,
      institution: "",
      documentType: "PDF document",
      reason: "PDF documents require manual review. Your application is under review.",
    };
  }

  const base64 = fileBytes.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const prompt = `You are verifying student status for an online learning platform.

Analyse this document and return ONLY a JSON object (no markdown, no explanation) with:
{
  "isStudent": boolean,
  "confidence": number between 0 and 1,
  "institution": "institution name or empty string",
  "documentType": "student ID card / enrollment letter / university card / transcript / other",
  "reason": "brief explanation of your decision"
}

Rules:
- isStudent true only if the document clearly proves current student enrollment
- confidence >= 0.85 means you are very confident it is a valid student document
- confidence < 0.85 means the document is unclear, expired, or you cannot be certain
- Look for: institution name, student name, enrollment dates, student ID number, course name
- Be strict: personal photos, random cards, or unreadable images should return isStudent false
- Expired documents (graduation date in the past) should return confidence < 0.5`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI service error: ${err.slice(0, 200)}`);
  }

  const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("AI returned no response.");

  try {
    const clean = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(clean) as VerifyResult;
    return {
      isStudent: Boolean(parsed.isStudent),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
      institution: String(parsed.institution ?? ""),
      documentType: String(parsed.documentType ?? "document"),
      reason: String(parsed.reason ?? ""),
    };
  } catch {
    throw new Error("AI returned an unreadable response.");
  }
}

async function ensureBucket(db: ReturnType<typeof createSupabaseServiceClient>) {
  const { data: buckets, error: listError } = await db.storage.listBuckets();
  if (listError) throw new Error(listError.message);
  if (buckets.some((b) => b.name === BUCKET)) return;
  const { error } = await db.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  });
  if (error && !/already exists/i.test(error.message)) throw new Error(error.message);
}

export async function POST(request: Request) {
  // Require a valid session for all verification paths — prevents unauthenticated
  // access and ensures userId always comes from the verified token, never the body.
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  try {
    const db = createSupabaseServiceClient();

    // ── Email-domain verification (JSON body) ─────────────────────────────────
    if (request.headers.get("content-type")?.includes("application/json")) {
      const limit = await consumeRateLimit(db, {
        // Rate limit by user ID (primary) — prevents IP-rotation bypass.
        // userId is always from the verified token, never client-supplied.
        key: `student-verify:user:${userId}`,
        max: 6,
        windowMs: 60 * 60 * 1000,
      });
      if (!limit.ok) {
        const r = errorResponse("Too many verification attempts. Try again later.", 429, {
          retryAfterSeconds: limit.retryAfterSeconds,
        });
        r.headers.set("Retry-After", String(limit.retryAfterSeconds));
        return r;
      }
      const body = await request.json() as { email?: string; method?: string };
      const email  = typeof body.email  === "string" ? body.email.trim().toLowerCase() : "";
      const { error: dbError } = await db
        .from("addition_student_verifications")
        .upsert({
          user_id: userId,
          status: "approved",
          method: "email_domain",
          institution: null,
          evidence_path: null,
          ai_confidence: 1,
          ai_reason: `Student email domain verified: ${email}`,
          reviewed_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      if (dbError) console.error("student-verify email-domain DB write failed:", dbError.message);
      return okResponse({ status: "approved", approved: true });
    }

    // ── Document upload verification (multipart form) ─────────────────────────
    const limit = await consumeRateLimit(db, {
      key: `student-verify:user:${userId}`,
      max: 6,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) {
      const response = errorResponse("Too many verification attempts. Try again later.", 429, {
        retryAfterSeconds: limit.retryAfterSeconds,
      });
      response.headers.set("Retry-After", String(limit.retryAfterSeconds));
      return response;
    }

    const form = await request.formData();
    const file = form.get("file");
    const email = typeof form.get("email") === "string" ? String(form.get("email")).trim().toLowerCase() : "";

    if (!(file instanceof File)) return errorResponse("A document file is required.", 400);
    if (file.size > MAX_BYTES) return errorResponse("Document must be smaller than 8MB.", 400);

    const bytes = Buffer.from(await file.arrayBuffer());
    // Validate by magic bytes — never trust the client-supplied Content-Type
    const mimeCheck = validateUploadMime(bytes, ALLOWED_TYPES);
    if (!mimeCheck.ok) return errorResponse(mimeCheck.error, 400);
    const mimeType = mimeCheck.mime;

    // Upload to storage
    await ensureBucket(db);
    const safeEmail = email.replace(/[^a-z0-9@._-]/g, "").replace("@", "-at-").slice(0, 80);
    const objectPath = `verify/${safeEmail}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extensionFor(file)}`;

    const { error: uploadError } = await db.storage.from(BUCKET).upload(objectPath, bytes, {
      cacheControl: "31536000",
      contentType: mimeType, // use validated MIME, not client-supplied file.type
      upsert: false,
    });
    if (uploadError) return errorResponse(uploadError.message, 500);

    // AI verification
    let aiResult: VerifyResult;
    try {
      aiResult = await verifyWithAI(bytes, mimeType);
    } catch (aiErr) {
      // AI failure → pending review rather than hard error
      aiResult = {
        isStudent: false,
        confidence: 0,
        institution: "",
        documentType: "document",
        reason: aiErr instanceof Error ? aiErr.message : "Verification unavailable.",
      };
    }

    const approved = aiResult.isStudent && aiResult.confidence >= AI_CONFIDENCE_THRESHOLD;
    const status = approved ? "approved" : "pending";

    // Write to addition_student_verifications
    const { error: dbError } = await db
      .from("addition_student_verifications")
      .upsert({
        user_id: userId,
        status,
        method: "ai_document",
        institution: aiResult.institution || null,
        evidence_path: objectPath,
        ai_confidence: aiResult.confidence,
        ai_reason: aiResult.reason,
        reviewed_at: approved ? new Date().toISOString() : null,
      }, { onConflict: "user_id" });

    if (dbError) {
      // Non-fatal — return result to client even if DB write failed
      console.error("student-verify DB write failed:", dbError.message);
    }

    return okResponse({
      status,
      approved,
      confidence: aiResult.confidence,
      institution: aiResult.institution,
      documentType: aiResult.documentType,
      reason: approved
        ? `Student status confirmed${aiResult.institution ? ` — ${aiResult.institution}` : ""}.`
        : status === "pending"
          ? "Your document is under review. You'll hear within 24 hours."
          : aiResult.reason,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Verification failed.", 500);
  }
}
