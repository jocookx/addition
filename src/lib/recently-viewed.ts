/**
 * Recently-viewed commands — localStorage-backed, client only.
 *
 * Powers the dashboard "Jump back in" row: the command you looked up at your
 * desk yesterday is one tap away today. Stored locally (not synced) because
 * it is a per-device convenience, not learning progress.
 */

export type RecentItem = {
  id: string;
  label: string;
  software?: string;
  ts: number;
};

const KEY = "addition_recents_v1";
const MAX_ITEMS = 8;

export function getRecentlyViewed(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentItem[]) : [];
    return Array.isArray(parsed) ? parsed.filter((r) => r && r.id && r.label) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(item: Omit<RecentItem, "ts">): void {
  if (typeof window === "undefined") return;
  try {
    const list = getRecentlyViewed().filter((r) => r.id !== item.id);
    list.unshift({ ...item, ts: Date.now() });
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {
    // Storage full / blocked — recents are a convenience, never an error
  }
}
