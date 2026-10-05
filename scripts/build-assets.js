import { readFileSync, writeFileSync } from "node:fs";

const indexHtml = readFileSync("public/index.html", "utf8");
const cookbookJs = readFileSync("public/cookbook.js", "utf8");
const mascotB64 = readFileSync("public/mascot.jpg").toString("base64");
const bgB64 = readFileSync("public/bg.jpg").toString("base64");

const code = `// Auto-generated embedded assets for zero-IO serverless deployment
export const INDEX_HTML = ${JSON.stringify(indexHtml)};
export const COOKBOOK_JS = ${JSON.stringify(cookbookJs)};
export const INDEX_HTML_BUF = Buffer.from(INDEX_HTML, "utf8");
export const COOKBOOK_JS_BUF = Buffer.from(COOKBOOK_JS, "utf8");
export const MASCOT_JPG = Buffer.from(${JSON.stringify(mascotB64)}, "base64");
export const BG_JPG = Buffer.from(${JSON.stringify(bgB64)}, "base64");
`;

writeFileSync("src/embedded-assets.ts", code, "utf8");
console.log("Built src/embedded-assets.ts successfully");
