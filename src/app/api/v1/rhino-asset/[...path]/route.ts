import { NextResponse } from "next/server";

const SUPABASE_ASSETS_BASE =
  "https://dmaxjlvswvvundgestwh.supabase.co/storage/v1/object/public/assets";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // Prevent path traversal
  const relative = segments.join("/");
  if (relative.includes("..")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Redirect to Supabase Storage (permanent cache-friendly redirect)
  const url = `${SUPABASE_ASSETS_BASE}/${relative}`;
  return NextResponse.redirect(url, {
    status: 301,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
