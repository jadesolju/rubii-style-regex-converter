import { buildApp } from "../src/app.ts";
import {
  INDEX_HTML_BUF,
  COOKBOOK_JS_BUF,
  MASCOT_JPG,
  BG_JPG,
  OG_IMAGE_PNG,
} from "../src/embedded-assets.ts";

const app = buildApp(false);
let isReady = false;

const STRIPPED_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "trailers",
  "upgrade",
]);

function resolveUrl(req: any): string {
  const rawUrl = req.url ?? "/";
  const [pathname, queryString] = rawUrl.split("?");
  const searchParams = new URLSearchParams(queryString ?? "");

  // 1. Explicit path parameter from Vercel rewrite rule (?path=/v1/...)
  const pathParam = searchParams.get("path");
  if (pathParam) {
    searchParams.delete("path");
    const remaining = searchParams.toString();
    const cleanPath = pathParam.startsWith("/") ? pathParam : "/" + pathParam;
    return cleanPath + (remaining ? `?${remaining}` : "");
  }

  // 2. Vercel x-matched-path header
  const matchedHeader = req.headers?.["x-matched-path"];
  const matchedPath = Array.isArray(matchedHeader) ? matchedHeader[0] : matchedHeader;
  if (matchedPath && matchedPath !== "/api/index" && matchedPath !== "/api" && matchedPath !== "/api/") {
    const cleanPath = matchedPath.startsWith("/") ? matchedPath : "/" + matchedPath;
    const cleanQuery = queryString ? `?${queryString}` : "";
    return cleanPath + cleanQuery;
  }

  // 3. Direct path if not rewritten to /api/index
  if (pathname !== "/api/index" && pathname !== "/api" && pathname !== "/api/") {
    return rawUrl;
  }

  return "/";
}

async function readPayload(req: any): Promise<Buffer | string | undefined> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
      return req.body;
    }
    return JSON.stringify(req.body);
  }

  if (typeof req[Symbol.asyncIterator] === "function" || typeof req.on === "function") {
    const chunks: Buffer[] = [];
    try {
      for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      if (chunks.length > 0) {
        return Buffer.concat(chunks);
      }
    } catch {
      // In case stream cannot be read
    }
  }

  return undefined;
}

export default async function handler(req: any, res: any) {
  try {
    const method = req.method ?? "GET";
    const url = resolveUrl(req);
    const pathname = url.split("?")[0];

    // Fast-path for static web assets if served through the function
    if (method === "GET" || method === "HEAD") {
      if (
        pathname === "/" ||
        pathname === "/index.html" ||
        pathname === "/api/index" ||
        pathname === "/api"
      ) {
        res.statusCode = 200;
        res.setHeader("content-type", "text/html; charset=utf-8");
        res.setHeader("content-length", INDEX_HTML_BUF.length);
        res.setHeader("cache-control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
        res.setHeader("cdn-cache-control", "public, s-maxage=86400, stale-while-revalidate=604800");
        res.setHeader("vercel-cdn-cache-control", "public, s-maxage=86400, stale-while-revalidate=604800");
        if (method === "HEAD") return res.end();
        return res.end(INDEX_HTML_BUF);
      }
      if (pathname === "/cookbook.js") {
        res.statusCode = 200;
        res.setHeader("content-type", "application/javascript; charset=utf-8");
        res.setHeader("content-length", COOKBOOK_JS_BUF.length);
        res.setHeader("cache-control", "public, max-age=86400, s-maxage=604800, immutable");
        res.setHeader("cdn-cache-control", "public, s-maxage=604800, immutable");
        res.setHeader("vercel-cdn-cache-control", "public, s-maxage=604800, immutable");
        if (method === "HEAD") return res.end();
        return res.end(COOKBOOK_JS_BUF);
      }
      if (pathname === "/mascot.jpg") {
        res.statusCode = 200;
        res.setHeader("content-type", "image/jpeg");
        res.setHeader("content-length", MASCOT_JPG.length);
        res.setHeader("cache-control", "public, max-age=86400, s-maxage=604800, immutable");
        res.setHeader("cdn-cache-control", "public, s-maxage=604800, immutable");
        res.setHeader("vercel-cdn-cache-control", "public, s-maxage=604800, immutable");
        if (method === "HEAD") return res.end();
        return res.end(MASCOT_JPG);
      }
      if (pathname === "/bg.jpg") {
        res.statusCode = 200;
        res.setHeader("content-type", "image/jpeg");
        res.setHeader("content-length", BG_JPG.length);
        res.setHeader("cache-control", "public, max-age=86400, s-maxage=604800, immutable");
        res.setHeader("cdn-cache-control", "public, s-maxage=604800, immutable");
        res.setHeader("vercel-cdn-cache-control", "public, s-maxage=604800, immutable");
        if (method === "HEAD") return res.end();
        return res.end(BG_JPG);
      }
      if (pathname === "/og-image.png") {
        res.statusCode = 200;
        res.setHeader("content-type", "image/png");
        res.setHeader("content-length", OG_IMAGE_PNG.length);
        res.setHeader("cache-control", "public, max-age=86400, s-maxage=604800, immutable");
        res.setHeader("cdn-cache-control", "public, s-maxage=604800, immutable");
        res.setHeader("vercel-cdn-cache-control", "public, s-maxage=604800, immutable");
        if (method === "HEAD") return res.end();
        return res.end(OG_IMAGE_PNG);
      }
    }

    // API and dynamic routes via Fastify
    if (!isReady) {
      await app.ready();
      isReady = true;
    }

    const headers = req.headers ?? {};
    const payload = await readPayload(req);

    const response = await app.inject({
      method,
      url,
      headers,
      payload,
    });

    const payloadBuffer = response.rawPayload ? Buffer.from(response.rawPayload) : Buffer.alloc(0);

    for (const [key, value] of Object.entries(response.headers)) {
      if (value !== undefined && !STRIPPED_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    res.statusCode = response.statusCode;
    if (method === "HEAD") {
      res.end();
    } else {
      res.end(payloadBuffer);
    }
  } catch (err: any) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: err?.message || "Internal Server Error",
        },
      }));
    }
  }
}
