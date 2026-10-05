import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const indexHtml = readFileSync("public/index.html");
const cookbookJs = readFileSync("public/cookbook.js");
const mascotB64 = readFileSync("public/mascot.jpg").toString("base64");
const bgB64 = readFileSync("public/bg.jpg").toString("base64");
const ogImageB64 = existsSync("public/og-image.png") ? readFileSync("public/og-image.png").toString("base64") : "";
const indexHtmlB64 = indexHtml.toString("base64");
const cookbookJsB64 = cookbookJs.toString("base64");

const code = `// Auto-generated embedded assets for zero-IO serverless deployment
export const INDEX_HTML_BUF = Buffer.from(${JSON.stringify(indexHtmlB64)}, "base64");
export const COOKBOOK_JS_BUF = Buffer.from(${JSON.stringify(cookbookJsB64)}, "base64");
export const MASCOT_JPG = Buffer.from(${JSON.stringify(mascotB64)}, "base64");
export const BG_JPG = Buffer.from(${JSON.stringify(bgB64)}, "base64");
export const OG_IMAGE_PNG = Buffer.from(${JSON.stringify(ogImageB64)}, "base64");
export const INDEX_HTML = INDEX_HTML_BUF.toString("utf8");
export const COOKBOOK_JS = COOKBOOK_JS_BUF.toString("utf8");
`;

writeFileSync("src/embedded-assets.ts", code, "utf8");

try {
  mkdirSync("dist", { recursive: true });
  cpSync("public", "dist", { recursive: true });
} catch {}

console.log("Built src/embedded-assets.ts with binary Buffers successfully");
