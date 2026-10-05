import { buildApp } from "../src/app.ts";
import {
  INDEX_HTML,
  COOKBOOK_JS,
  INDEX_HTML_BUF,
  COOKBOOK_JS_BUF,
  MASCOT_JPG,
  BG_JPG,
} from "../src/embedded-assets.ts";

const app = buildApp();
let isReady = false;

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-length",
  "te",
  "trailer",
  "trailers",
  "upgrade",
]);

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
  const method = req.method ?? "GET";
  const url = normalizeUrl(req.url);
  const pathname = url.split("?")[0];

  // Direct fast-path for static web assets (0ms response, zero overhead)
  if (method === "GET" || method === "HEAD") {
    if (pathname === "/" || pathname === "/index.html") {
      res.statusCode = 200;
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.setHeader("content-length", INDEX_HTML_BUF.length);
      res.setHeader("cache-control", "public, max-age=3600, s-maxage=86400");
      if (method === "HEAD") return res.end();
      return res.end(INDEX_HTML_BUF);
    }
    if (pathname === "/cookbook.js") {
      res.statusCode = 200;
      res.setHeader("content-type", "application/javascript; charset=utf-8");
      res.setHeader("content-length", COOKBOOK_JS_BUF.length);
      res.setHeader("cache-control", "public, max-age=86400, s-maxage=604800");
      if (method === "HEAD") return res.end();
      return res.end(COOKBOOK_JS_BUF);
    }
    if (pathname === "/mascot.jpg") {
      res.statusCode = 200;
      res.setHeader("content-type", "image/jpeg");
      res.setHeader("content-length", MASCOT_JPG.length);
      res.setHeader("cache-control", "public, max-age=86400, s-maxage=604800");
      if (method === "HEAD") return res.end();
      return res.end(MASCOT_JPG);
    }
    if (pathname === "/bg.jpg") {
      res.statusCode = 200;
      res.setHeader("content-type", "image/jpeg");
      res.setHeader("content-length", BG_JPG.length);
      res.setHeader("cache-control", "public, max-age=86400, s-maxage=604800");
      if (method === "HEAD") return res.end();
      return res.end(BG_JPG);
    }
  }

  // API and dynamic routes via Fastify
  if (!isReady) {
    await app.ready();
    isReady = true;
  }

  const headers = req.headers ?? {};
  const payload = req.body !== undefined && req.body !== null ? req.body : undefined;

  const response = await app.inject({
    method,
    url,
    headers,
    payload,
  });

  const payloadBuffer = response.rawPayload ? Buffer.from(response.rawPayload) : Buffer.alloc(0);

  for (const [key, value] of Object.entries(response.headers)) {
    if (value !== undefined && !HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      res.setHeader(key, value);
    }
  }

  res.setHeader("content-length", payloadBuffer.length);
  res.statusCode = response.statusCode;
  if (method === "HEAD") {
    res.end();
  } else {
    res.end(payloadBuffer);
  }
}
