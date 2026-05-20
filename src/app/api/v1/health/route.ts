import { okResponse } from "@/lib/http";

export async function GET() {
  return okResponse({
    ok: true,
    service: "addition-platform-web",
    version: "v1",
    now: new Date().toISOString(),
  });
}

