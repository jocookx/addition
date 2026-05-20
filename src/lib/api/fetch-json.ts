type FetchJsonOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  headers?: HeadersInit;
  body?: string;
  timeoutMs?: number;
  retries?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const method = options.method || "GET";
  const timeoutMs = options.timeoutMs ?? 12_000;
  const retries = options.retries ?? (method === "GET" ? 1 : 0);

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const bodyText = await response.text();
        let message = bodyText.trim();
        try {
          const parsed = JSON.parse(bodyText) as { error?: unknown; message?: unknown };
          const candidate = parsed.error ?? parsed.message;
          if (typeof candidate === "string" && candidate.trim()) message = candidate.trim();
        } catch {
          // Keep the raw text for non-JSON error responses.
        }
        throw new Error(message ? `Request failed (${response.status}): ${message}` : `Request failed (${response.status})`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt >= retries;
      if (isLastAttempt) break;
      await sleep(250 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error("Request failed.");
}
