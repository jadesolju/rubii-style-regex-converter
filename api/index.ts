import { buildApp } from "../src/app.ts";

const app = buildApp();
let isReady = false;

export default async function handler(req: any, res: any) {
  if (!isReady) {
    await app.ready();
    isReady = true;
  }

  const method = req.method ?? "GET";
  const url = req.url ?? "/";
  const headers = req.headers ?? {};
  const payload = req.body !== undefined && req.body !== null ? req.body : undefined;

  const response = await app.inject({
    method,
    url,
    headers,
    payload,
  });

  for (const [key, value] of Object.entries(response.headers)) {
    if (value !== undefined) {
      res.setHeader(key, value);
    }
  }

  if (typeof res.status === "function") {
    res.status(response.statusCode);
  } else {
    res.statusCode = response.statusCode;
  }

  if (typeof res.send === "function") {
    res.send(response.body);
  } else {
    res.end(response.body);
  }
}
