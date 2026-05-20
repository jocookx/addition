import { NextResponse } from "next/server";

export function okResponse<T>(
  data: T,
  status = 200,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json(data, { status, headers });
}

/**
 * Returns a cached OK response.
 * @param sMaxAge  - CDN/edge cache TTL in seconds (default 5 min)
 * @param swr      - stale-while-revalidate window in seconds (default 1 hr)
 */
export function cachedOkResponse<T>(
  data: T,
  sMaxAge = 300,
  swr = 3600,
): NextResponse {
  return okResponse(data, 200, {
    "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
  });
}

export function errorResponse(message: string, status: number, details?: unknown): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

