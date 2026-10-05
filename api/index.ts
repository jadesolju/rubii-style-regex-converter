import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/app.ts";

const app = buildApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await app.ready();
  app.server.emit("request", req, res);
}
