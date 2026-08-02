"use client";

/**
 * Direct-to-storage uploads for the studio.
 *
 * Flow: ask /api/v1/admin/uploads/sign for a signed-upload token, then PUT
 * the file straight to Supabase Storage from the browser. The file never
 * passes through our server, so uploads are not subject to the serverless
 * request-body cap (~4.5MB on Vercel) and don't tie up a function.
 */

import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

export type UploadKind = "image" | "file";

type SignResponse = {
  bucket: string;
  path: string;
  token: string;
  publicUrl: string;
  error?: string;
};

export async function uploadViaSignedUrl(
  accessToken: string,
  file: File,
  { kind = "image", folder = "general" }: { kind?: UploadKind; folder?: string } = {},
): Promise<{ url: string; path: string }> {
  const signRes = await fetch("/api/v1/admin/uploads/sign", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ kind, folder, filename: file.name, sizeBytes: file.size }),
  });

  const payload = (await signRes.json().catch(() => ({}))) as SignResponse;
  if (!signRes.ok) throw new Error(payload.error || "Could not prepare the upload.");
  if (!payload.token || !payload.path || !payload.bucket) {
    throw new Error("Upload signing returned an incomplete response.");
  }

  const supabase = getBrowserSupabaseClient();
  if (!supabase) throw new Error("Storage client is not available in this context.");

  const { error } = await supabase.storage
    .from(payload.bucket)
    .uploadToSignedUrl(payload.path, payload.token, file, {
      contentType: file.type || undefined,
      cacheControl: "31536000",
    });
  if (error) throw new Error(error.message);

  return { url: payload.publicUrl, path: payload.path };
}
