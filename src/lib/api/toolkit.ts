import type { ToolkitItem, ToolkitItemType } from "@/domain/toolkit";
import { fetchJson } from "@/lib/api/fetch-json";

function authHeaders(accessToken?: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export async function getToolkit(accessToken: string): Promise<ToolkitItem[]> {
  const payload = await fetchJson<{ items?: ToolkitItem[] }>(`/api/v1/toolkit`, {
    method: "GET",
    headers: authHeaders(accessToken),
    retries: 2,
    timeoutMs: 10_000,
  });
  return payload.items || [];
}

export async function saveToolkitItem(
  contentId: string,
  contentType: ToolkitItemType,
  accessToken: string,
): Promise<void> {
  await fetchJson<{ saved?: boolean }>(`/api/v1/toolkit/${encodeURIComponent(contentId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify({ contentType }),
    retries: 0,
    timeoutMs: 10_000,
  });
}

export async function removeToolkitItem(
  contentId: string,
  contentType: ToolkitItemType,
  accessToken: string,
): Promise<void> {
  const url = new URL(`/api/v1/toolkit/${encodeURIComponent(contentId)}`, window.location.origin);
  url.searchParams.set("type", contentType);

  await fetchJson<{ removed?: boolean }>(url.toString(), {
    method: "DELETE",
    headers: authHeaders(accessToken),
    retries: 0,
    timeoutMs: 10_000,
  });
}
