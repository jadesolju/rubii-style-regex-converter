import { buildApp } from "../src/app.ts";

const app = buildApp();
let isReady = false;

function normalizeUrl(rawUrl: string | undefined): string {
  let url = rawUrl ?? "/";
  if (url === "/api/index" || url === "/api" || url === "/api/") {
    return "/";
  }
  if (url.startsWith("/api/index?")) {
    const queryIndex = url.indexOf("?");
    const searchParams = new URLSearchParams(url.slice(queryIndex + 1));
    const matchedPath = searchParams.get("x-matched-path");
    if (matchedPath) {
      searchParams.delete("x-matched-path");
      const remainingQuery = searchParams.toString();
      return matchedPath + (remainingQuery ? `?${remainingQuery}` : "");
    }
    return "/" + url.slice(queryIndex);
  }
  return url;
}

export default async function handler(req: any, res: any) {
  if (!isReady) {
    await app.ready();
    isReady = true;
  }

  const method = req.method ?? "GET";
  const url = normalizeUrl(req.url);
  const headers = req.headers ?? {};
  const payload = req.body !== undefined && req.body !== null ? req.body : undefined;

  const response = await app.inject({
    method,
    url,
    headers,
    payload,
  });

  for (const [key, value] of Object.entries(response.headers)) {
    const lower = key.toLowerCase();
    if (value !== undefined && lower !== "content-length" && lower !== "transfer-encoding") {
      res.setHeader(key, value);
    }
  }

  res.statusCode = response.statusCode;
  if (method === "HEAD") {
    res.end();
  } else {
    res.end(response.rawPayload);
  }
}
