import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const IMAGES_DIR = path.resolve(process.cwd(), "..", "..", "data", "images");

const MIME: Record<string, string> = {
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".webp": "image/webp",
  ".svg":  "image/svg+xml",
};

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
  const filePath = path.join(IMAGES_DIR, relative);
  // Ensure the resolved path stays inside IMAGES_DIR
  if (!filePath.startsWith(IMAGES_DIR)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
