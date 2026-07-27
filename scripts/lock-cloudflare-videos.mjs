import { existsSync, readFileSync } from "node:fs";

loadEnvFiles([".env", ".env.local"]);

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;

if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID is required.");
if (!apiToken) throw new Error("CLOUDFLARE_STREAM_API_TOKEN is required.");

const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`;

function loadEnvFiles(files) {
  for (const file of files) {
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index <= 0) continue;
      const key = trimmed.slice(0, index).trim();
      const rawValue = trimmed.slice(index + 1).trim();
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  }
}

async function cf(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok || body.success === false) {
    throw new Error(`Cloudflare API ${response.status}: ${text.slice(0, 500)}`);
  }
  return body;
}

async function listVideos() {
  const videos = [];
  let page = 1;
  for (;;) {
    const body = await cf(`?per_page=100&page=${page}`);
    videos.push(...(body.result ?? []));
    const info = body.result_info ?? {};
    if (!info.total_pages || page >= info.total_pages) break;
    page += 1;
  }
  return videos;
}

const videos = await listVideos();
let changed = 0;
for (const video of videos) {
  if (!video.uid) continue;
  if (video.requireSignedURLs === true) {
    console.log(`already locked ${video.uid}`);
    continue;
  }
  await cf(`/${encodeURIComponent(video.uid)}`, {
    method: "POST",
    body: JSON.stringify({ uid: video.uid, requireSignedURLs: true }),
  });
  changed += 1;
  console.log(`locked ${video.uid}`);
}

console.log(`Cloudflare Stream hardening complete. ${changed}/${videos.length} videos changed.`);
