const unavailable = "Service unavailable. Please try again shortly.";

export function normalizeApiBase(configured?: string): string {
  const base = configured?.trim().replace(/\/+$/, "") || "/api/v1";
  if (/^https?:\/\/[^/]+$/.test(base)) return `${base}/api/v1`;
  if (base.endsWith("/api")) return `${base}/v1`;
  return base;
}

export async function requestJson<T>(base: string, path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${normalizeApiBase(base)}/${path.replace(/^\/+/, "")}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error(unavailable);
  }
  if (!response.ok) throw new Error(unavailable);
  const contentType = response.headers.get("content-type") || "";
  if (!/^application\/(?:[\w.-]+\+)?json(?:\s*;|$)/i.test(contentType)) {
    throw new Error(unavailable);
  }
  try {
    return await response.json() as T;
  } catch {
    throw new Error(unavailable);
  }
}

export async function postJson<T>(base: string, path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${normalizeApiBase(base)}/${path.replace(/^\/+/, "")}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error(unavailable);
  }
  if (!response.ok) {
    let errMessage = unavailable;
    try {
      const errJson = await response.json();
      if (errJson?.error) errMessage = errJson.error;
    } catch {}
    throw new Error(errMessage);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!/^application\/(?:[\w.-]+\+)?json(?:\s*;|$)/i.test(contentType)) {
    throw new Error(unavailable);
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(unavailable);
  }
}
