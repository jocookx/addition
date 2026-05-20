const candidateBaseUrls = [
  process.env.LAUNCH_SMOKE_BASE_URL,
  "http://127.0.0.1:3001",
  "http://localhost:3000",
].filter(Boolean);

const adminToken = process.env.LAUNCH_SMOKE_ADMIN_TOKEN || "";

const csvEntities = [
  "courses",
  "paths",
  "workshops",
  "commands",
  "combos",
  "resources",
  "problem-solver",
  "practice-decks",
  "flashcards",
  "quiz-questions",
  "certificates",
];

const routeChecks = [
  { path: "/", label: "Landing page", expect: "html", includes: ["addition"] },
  { path: "/auth?mode=signup", label: "Signup", expect: "html", includes: ["Google"] },
  { path: "/dashboard", label: "Dashboard", expect: "html" },
  { path: "/workshops", label: "Workshops", expect: "html", includes: ["Workshop"] },
  { path: "/admin", label: "Admin portal", expect: "html", includes: ["Admin"] },
  { path: "/api/v1/health", label: "Health API", expect: "json" },
  { path: "/api/v1/commands", label: "Commands API", expect: "json", minBytes: 500 },
  { path: "/api/v1/paths", label: "Paths API", expect: "json" },
  { path: "/api/v1/workshops?upcoming=false", label: "Workshops API", expect: "json" },
];

function formatUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString();
}

async function findBaseUrl() {
  const errors = [];
  for (const baseUrl of candidateBaseUrls) {
    try {
      const response = await fetch(formatUrl(baseUrl, "/api/v1/health"), {
        headers: { Accept: "application/json" },
      });
      if (response.ok) return baseUrl;
      errors.push(`${baseUrl} returned ${response.status}`);
    } catch (error) {
      errors.push(`${baseUrl} ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`No launch smoke base URL is reachable. Tried: ${errors.join("; ")}`);
}

async function request(baseUrl, path, options = {}) {
  const started = Date.now();
  const response = await fetch(formatUrl(baseUrl, path), options);
  const text = await response.text();
  return { response, text, elapsedMs: Date.now() - started };
}

function parseJson(label, text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} did not return valid JSON`);
  }
}

async function runRouteCheck(baseUrl, check) {
  const { response, text, elapsedMs } = await request(baseUrl, check.path, {
    headers: { Accept: check.expect === "json" ? "application/json" : "text/html,application/xhtml+xml" },
  });

  if (!response.ok) throw new Error(`${check.label} returned ${response.status}`);
  if (check.expect === "json") parseJson(check.label, text);
  if (check.minBytes && text.length < check.minBytes) {
    throw new Error(`${check.label} response was unexpectedly small (${text.length} bytes)`);
  }
  for (const expected of check.includes ?? []) {
    if (!text.toLowerCase().includes(expected.toLowerCase())) {
      throw new Error(`${check.label} did not include "${expected}"`);
    }
  }
  return { label: check.label, path: check.path, status: response.status, bytes: text.length, elapsedMs };
}

function getCohortId(workshopId) {
  return String(workshopId).replace(/^ws-/, "").replace(/-w\d+[a-z]$/, "");
}

function assertWorkshopReady(workshop) {
  const missing = [];
  if (!workshop.id) missing.push("id");
  if (!workshop.title) missing.push("title");
  if (!workshop.date) missing.push("date");
  if (!workshop.time) missing.push("time");
  if (!workshop.timezone) missing.push("timezone");
  if (!workshop.duration) missing.push("duration");
  if (!workshop.format) missing.push("format");
  if (!Number.isFinite(Number(workshop.capacity)) || Number(workshop.capacity) <= 0) missing.push("capacity");
  if (!Number.isFinite(Number(workshop.pricePence))) missing.push("pricePence");
  if (!workshop.image) missing.push("image");
  if (!Array.isArray(workshop.learn) || workshop.learn.length === 0) missing.push("learn");
  if (!workshop.tutorName) missing.push("tutorName");
  if (missing.length) throw new Error(`${workshop.id || "Workshop"} is missing launch fields: ${missing.join(", ")}`);
}

function assertWorkshopDetailReady(detail) {
  const missing = [];
  if (!detail.description) missing.push("description");
  if (!Array.isArray(detail.included) || detail.included.length === 0) missing.push("included");
  if (!detail.tutorName) missing.push("tutorName");
  if (!detail.tutorBio) missing.push("tutorBio");
  if (Number(detail.pricePence ?? 0) > 0 && !detail.stripePaymentLink && !process.env.STRIPE_SECRET_KEY) {
    missing.push("stripePaymentLink or STRIPE_SECRET_KEY");
  }
  if (missing.length) throw new Error(`${detail.id || "Workshop detail"} is missing launch fields: ${missing.join(", ")}`);
}

async function runWorkshopJourneyChecks(baseUrl) {
  const { response, text } = await request(baseUrl, "/api/v1/workshops?upcoming=false", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Workshops API returned ${response.status}`);
  const body = parseJson("Workshops API", text);
  const workshops = Array.isArray(body.workshops) ? body.workshops : [];
  if (!workshops.length) throw new Error("No workshops returned from current Supabase data.");

  const upcoming = workshops.find((workshop) => workshop.upcoming) ?? null;
  const past = workshops.find((workshop) => !workshop.upcoming) ?? null;
  if (!upcoming) throw new Error("No upcoming workshop found for launch checkout journey.");
  assertWorkshopReady(upcoming);
  const detailApi = await request(baseUrl, `/api/v1/workshops/${encodeURIComponent(upcoming.id)}`, {
    headers: { Accept: "application/json" },
  });
  if (!detailApi.response.ok) throw new Error(`Workshop detail API returned ${detailApi.response.status}`);
  const detailBody = parseJson("Workshop detail API", detailApi.text);
  assertWorkshopDetailReady(detailBody.workshop ?? {});

  const cohortId = getCohortId(upcoming.id);
  const detail = await runRouteCheck(baseUrl, {
    path: `/workshops/${encodeURIComponent(cohortId)}`,
    label: "Upcoming workshop detail",
    expect: "html",
  });
  const checkout = await runRouteCheck(baseUrl, {
    path: `/workshops/${encodeURIComponent(cohortId)}/checkout`,
    label: "Upcoming workshop checkout",
    expect: "html",
  });

  const results = [detail, checkout];

  if (past) {
    const pastCohortId = getCohortId(past.id);
    results.push(await runRouteCheck(baseUrl, {
      path: `/workshops/${encodeURIComponent(pastCohortId)}`,
      label: "Past workshop detail",
      expect: "html",
      includes: ["workshop"],
    }));
  }

  return results;
}

async function runCsvTemplateChecks(baseUrl) {
  if (!adminToken) {
    return {
      skipped: true,
      reason: "Set LAUNCH_SMOKE_ADMIN_TOKEN to verify protected admin CSV template downloads.",
      results: [],
    };
  }

  const results = [];
  for (const entity of csvEntities) {
    const { response, text, elapsedMs } = await request(baseUrl, `/api/v1/admin/csv/${entity}/template`, {
      headers: {
        Accept: "text/csv",
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (!response.ok) throw new Error(`CSV template ${entity} returned ${response.status}: ${text}`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/csv")) throw new Error(`CSV template ${entity} returned ${contentType || "no content type"}`);
    if (!text.includes(",") || text.trim().split(/\r?\n/).length < 2) {
      throw new Error(`CSV template ${entity} did not look like a useful template`);
    }
    results.push({ label: `CSV template: ${entity}`, path: `/api/v1/admin/csv/${entity}/template`, status: response.status, bytes: text.length, elapsedMs });
  }

  const unknown = await request(baseUrl, "/api/v1/admin/csv/not-a-real-entity/template", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
  });
  if (unknown.response.status !== 404) {
    throw new Error(`Unknown CSV template returned ${unknown.response.status}; expected 404`);
  }
  results.push({ label: "CSV template: unknown entity guard", path: "/api/v1/admin/csv/not-a-real-entity/template", status: 404, bytes: unknown.text.length, elapsedMs: unknown.elapsedMs });
  return { skipped: false, results };
}

const results = [];
const warnings = [];
const failures = [];

let baseUrl;
try {
  baseUrl = await findBaseUrl();
  console.log(`Launch smoke base URL: ${baseUrl}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

for (const check of routeChecks) {
  try {
    results.push(await runRouteCheck(baseUrl, check));
  } catch (error) {
    failures.push({ label: check.label, path: check.path, error: error instanceof Error ? error.message : String(error) });
  }
}

try {
  results.push(...await runWorkshopJourneyChecks(baseUrl));
} catch (error) {
  failures.push({ label: "Workshop journey", path: "/workshops", error: error instanceof Error ? error.message : String(error) });
}

try {
  const csv = await runCsvTemplateChecks(baseUrl);
  if (csv.skipped) warnings.push(csv.reason);
  results.push(...csv.results);
} catch (error) {
  failures.push({ label: "Admin CSV templates", path: "/api/v1/admin/csv/[entity]/template", error: error instanceof Error ? error.message : String(error) });
}

for (const result of results) {
  console.log(`PASS ${result.status} ${result.path} ${result.bytes}b ${result.elapsedMs}ms - ${result.label}`);
}

for (const warning of warnings) {
  console.warn(`SKIP ${warning}`);
}

if (failures.length) {
  for (const failure of failures) {
    console.error(`FAIL ${failure.path} - ${failure.label}: ${failure.error}`);
  }
  process.exit(1);
}

console.log(`Launch smoke checks passed for ${baseUrl}`);
