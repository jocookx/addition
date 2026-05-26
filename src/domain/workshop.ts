export type WorkshopFormat = "online" | "in-person";

export type WorkshopRecording = {
  id: string;
  title: string;
  video: string;
};

export type WorkshopListItem = {
  id: string;
  title: string;
  date: string;          // ISO date "2026-04-06"
  time: string;          // "10:00"
  timezone: string;
  duration: string;
  format: WorkshopFormat;
  location: string;
  price: string;         // formatted "£85"
  pricePence: number;
  capacity: number;
  upcoming: boolean;
  track: string;         // "Architecture" | "Interiors" | "Computational"
  level: string;         // "Foundations" | "Applied" | "Advanced"
  week: number;
  software: string[];
  image: string;
  stripePaymentLink: string | null;
  tutorName: string | null;
  learn: string[];
  startTime?: string | null;
  endTime?: string | null;
  liveProvider?: "zoom" | "youtube" | "vimeo" | "custom" | "other";
  joinUrl?: string;
  hostUrl?: string;
  meetingId?: string;
  passcode?: string;
  liveEmbedUrl?: string;
  calendarUrl?: string;
  preWork?: string[];
  resources?: string[];
  recordingStatus?: "none" | "processing" | "available" | "failed";
  recordingUrl?: string;
  recordingEmbedUrl?: string;
  recordingDuration?: string;
  recordingThumbnail?: string;
  recordingUploadedAt?: string | null;
  recordingAccessLevel?: "booked_users" | "pro" | "student" | "purchased" | "free";
  bookingStatus?: "registered" | "confirmed" | "waitlisted" | "cancelled" | "completed" | "refunded" | null;
};

export type WorkshopDetail = WorkshopListItem & {
  description: string;
  learn: string[];
  included: string[];
  principles: string[];
  recordings: WorkshopRecording[];
  gallery: string[];
  tutorId: string | null;
  tutorBio: string | null;
  tutorImage: string | null;
};
