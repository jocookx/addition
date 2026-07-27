import { Resend } from "resend";

export type WorkshopRecordingAvailableData = {
  toEmail: string;
  toName: string | null;
  workshopTitle: string;
  recordingUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendWorkshopRecordingAvailable(data: WorkshopRecordingAvailableData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[email] RESEND_API_KEY not set - skipping workshop recording email.");
    return;
  }

  const from = process.env.RESEND_FROM ?? "Addition Academy <workshops@addition.academy>";
  const resend = new Resend(apiKey);
  const title = escapeHtml(data.workshopTitle);
  const url = escapeHtml(data.recordingUrl);
  const greeting = data.toName ? `Hi ${escapeHtml(data.toName)},` : "Hi,";

  const { error } = await resend.emails.send({
    from,
    to: data.toEmail,
    subject: `Workshop recording available - ${data.workshopTitle}`,
    html: `<!DOCTYPE html><html lang="en"><body style="font-family:system-ui,sans-serif;background:#0a0f1a;color:#e8eaf0;max-width:560px;margin:0 auto;padding:32px 24px;">
      <p style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#4dd5a6;margin-bottom:24px;">ADDITION</p>
      <h1 style="font-size:1.5rem;margin-bottom:8px;">Recording available.</h1>
      <p style="color:#8892a4;">${greeting}<br>The recording for <strong style="color:#e8eaf0;">${title}</strong> is now available.</p>
      <p style="margin:28px 0;"><a href="${url}" style="background:#7c3aed;color:white;text-decoration:none;padding:11px 16px;border-radius:8px;display:inline-block;">Watch recording</a></p>
      <p style="color:#8892a4;font-size:13px;">You can also access it from My Workshops in your dashboard.</p>
    </body></html>`,
    text: [
      "ADDITION - Workshop recording available",
      "",
      greeting,
      `The recording for "${data.workshopTitle}" is now available.`,
      "",
      data.recordingUrl,
    ].join("\n"),
  });

  if (error) console.error("[email] Recording available email error:", error);
}
