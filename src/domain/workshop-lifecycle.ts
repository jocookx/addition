export type WorkshopLifecycleState =
  | "upcoming"
  | "starting_soon"
  | "live"
  | "completed"
  | "recording_processing"
  | "recording_available"
  | "cancelled";

export type WorkshopLifecycleInput = {
  startTime?: string | null;
  endTime?: string | null;
  date?: string | null;
  time?: string | null;
  duration?: string | null;
  upcoming?: boolean | null;
  recordingStatus?: string | null;
  cancelled?: boolean | null;
};

function fallbackStart(input: WorkshopLifecycleInput): Date | null {
  if (input.startTime) {
    const date = new Date(input.startTime);
    if (!Number.isNaN(date.getTime())) return date;
  }
  if (!input.date) return null;
  const date = new Date(`${input.date}T${input.time || "09:00"}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function fallbackEnd(input: WorkshopLifecycleInput, start: Date | null): Date | null {
  if (input.endTime) {
    const date = new Date(input.endTime);
    if (!Number.isNaN(date.getTime())) return date;
  }
  if (!start) return null;
  const hours = Number(input.duration?.match(/\d+(\.\d+)?/)?.[0] || 2);
  return new Date(start.getTime() + Math.max(1, hours) * 60 * 60 * 1000);
}

export function getWorkshopLifecycle(input: WorkshopLifecycleInput, now = new Date()): WorkshopLifecycleState {
  if (input.cancelled || input.upcoming === false && input.recordingStatus === "failed") return "cancelled";

  const start = fallbackStart(input);
  const end = fallbackEnd(input, start);
  const recordingStatus = String(input.recordingStatus || "none").toLowerCase();

  if (recordingStatus === "available") return "recording_available";
  if (recordingStatus === "processing") return "recording_processing";

  if (!start || !end) return input.upcoming ? "upcoming" : "completed";

  const msUntilStart = start.getTime() - now.getTime();
  if (msUntilStart > 30 * 60 * 1000) return "upcoming";
  if (msUntilStart > 0) return "starting_soon";
  if (now.getTime() <= end.getTime()) return "live";
  return "completed";
}

export function formatWorkshopCountdown(input: WorkshopLifecycleInput, now = new Date()): string {
  const state = getWorkshopLifecycle(input, now);
  if (state === "starting_soon") return "Starting soon";
  if (state === "live") return "Live now";
  if (state === "recording_processing") return "Recording processing";
  if (state === "recording_available") return "Recording available";
  if (state === "cancelled") return "Cancelled";

  const start = fallbackStart(input);
  if (!start) return state === "completed" ? "Completed" : "Upcoming";
  if (state === "completed") return "Completed";

  const diff = Math.max(0, start.getTime() - now.getTime());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `Starts in ${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
  return `Starts in ${minutes}m`;
}
