import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const indexHtml = readFileSync("public/index.html");
const cookbookJs = readFileSync("public/cookbook.js");
const indexHtmlGz = gzipSync(indexHtml);
const cookbookJsGz = gzipSync(cookbookJs);
const mascotB64 = readFileSync("public/mascot.jpg").toString("base64");
const bgB64 = readFileSync("public/bg.jpg").toString("base64");

const code = `// Auto-generated embedded assets for zero-IO serverless deployment
export const INDEX_HTML = ${JSON.stringify(indexHtml.toString("utf8"))};
export const COOKBOOK_JS = ${JSON.stringify(cookbookJs.toString("utf8"))};
export const INDEX_HTML_GZ = Buffer.from(${JSON.stringify(indexHtmlGz.toString("base64"))}, "base64");
export const COOKBOOK_JS_GZ = Buffer.from(${JSON.stringify(cookbookJsGz.toString("base64"))}, "base64");
export const MASCOT_JPG = Buffer.from(${JSON.stringify(mascotB64)}, "base64");
export const BG_JPG = Buffer.from(${JSON.stringify(bgB64)}, "base64");
`;

writeFileSync("src/embedded-assets.ts", code, "utf8");

try {
  mkdirSync("dist", { recursive: true });
  cpSync("public", "dist", { recursive: true });
} catch {}

console.log("Built src/embedded-assets.ts with pre-compressed gzip assets");
