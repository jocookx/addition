// Workshop booking confirmation email
//
// Requires: RESEND_API_KEY and RESEND_FROM in environment variables.
//   RESEND_API_KEY=re_...
//   RESEND_FROM=Addition Academy <workshops@addition.academy>

import { Resend } from "resend";

export type WorkshopConfirmationData = {
  toEmail: string;
  toName: string | null;
  workshopId: string;
  workshopTitle: string;
  date: string;          // ISO "2026-04-14"
  time: string;          // "19:00"
  timezone: string;      // "Europe/London"
  format: string;        // "Online" | "In person"
  location: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildHtml(d: WorkshopConfirmationData): string {
  const greeting = d.toName ? `Hi ${escapeHtml(d.toName)},` : "Hi,";
  const workshopTitle = escapeHtml(d.workshopTitle);
  const time = escapeHtml(d.time);
  const timezone = escapeHtml(d.timezone);
  const workshopId = escapeHtml(d.workshopId);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Workshop Booking Confirmed</title></head>
<body style="font-family:system-ui,sans-serif;background:#0a0f1a;color:#e8eaf0;max-width:560px;margin:0 auto;padding:32px 24px;">
  <p style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#4dd5a6;margin-bottom:24px;">ADDITION</p>
  <h1 style="font-size:1.5rem;margin-bottom:8px;line-height:1.2;">You're booked in.</h1>
  <p style="color:#8892a4;margin-bottom:32px;">${greeting}<br>
  Your place on <strong style="color:#e8eaf0;">${workshopTitle}</strong> is confirmed.</p>

  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:32px;">
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);color:#8892a4;width:120px;">Date</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">${formatDate(d.date)}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);color:#8892a4;">Time</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">${time} ${timezone}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);color:#8892a4;">Format</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">${d.format}${d.location ? ` — ${d.location}` : ""}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;color:#8892a4;">Session ID</td>
      <td style="padding:10px 0;font-family:monospace;font-size:12px;color:#8892a4;">${workshopId}</td>
    </tr>
  </table>

  <p style="color:#8892a4;font-size:13px;">You'll receive a joining link closer to the session.
  If you have questions, reply to this email.</p>

  <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:40px;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
    Addition Academy — addition.academy
  </p>
</body>
</html>`;
}

function buildText(d: WorkshopConfirmationData): string {
  const greeting = d.toName ? `Hi ${d.toName},` : "Hi,";
  return [
    "ADDITION — Workshop Booking Confirmed",
    "",
    greeting,
    `Your place on "${d.workshopTitle}" is confirmed.`,
    "",
    `Date:   ${formatDate(d.date)}`,
    `Time:   ${d.time} ${d.timezone}`,
    `Format: ${d.format}${d.location ? ` — ${d.location}` : ""}`,
    `ID:     ${d.workshopId}`,
    "",
    "You'll receive a joining link closer to the session.",
    "Questions? Reply to this email.",
    "",
    "— ADDITION",
  ].join("\n");
}

export async function sendWorkshopConfirmation(
  data: WorkshopConfirmationData,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      `[email] RESEND_API_KEY not set — workshop confirmation email to ${data.toEmail} was NOT sent. ` +
      "Set RESEND_API_KEY in the deployment environment.",
    );
    return;
  }

  const from = process.env.RESEND_FROM ?? "Addition Academy <workshops@addition.academy>";
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to:      data.toEmail,
    subject: `Workshop booking confirmed — ${data.workshopTitle}`,
    html:    buildHtml(data),
    text:    buildText(data),
  });

  if (error) {
    // Non-fatal: registration is already confirmed in DB
    console.error("[email] Resend error:", error);
  }
}
