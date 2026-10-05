import vm from "node:vm";

export type RegexTestInput = {
  pattern: string;
  flags: string;
  replacement: string;
  input: string;
};

export type RegexTestResult = {
  matches: Array<{ match: string; captures: Array<string | null>; index: number }>;
  output: string;
  truncated: boolean;
};

const scriptSource = `
const MAX_MATCHES = 100;
const MAX_OUTPUT = 65536;
function advanceStringIndex(text, index, unicode) {
  if (!unicode || index + 1 >= text.length) return index + 1;
  const first = text.charCodeAt(index);
  if (first < 0xD800 || first > 0xDBFF) return index + 1;
  const second = text.charCodeAt(index + 1);
  return second >= 0xDC00 && second <= 0xDFFF ? index + 2 : index + 1;
}
function expandReplacement(template, match, input) {
  const chunks = [];
  let size = 0;
  function append(value) {
    size += value.length;
    if (size > MAX_OUTPUT) throw new Error('OUTPUT_LIMIT');
    chunks.push(value);
  }
  for (let i = 0; i < template.length; i++) {
    if (template[i] !== '$' || i + 1 >= template.length) { append(template[i]); continue; }
    const next = template[i + 1];
    if (next === '$') { append('$'); i++; continue; }
    if (next === '&') { append(match[0]); i++; continue; }
    if (next === String.fromCharCode(96)) { append(input.slice(0, match.index)); i++; continue; }
    if (next === "'") { append(input.slice(match.index + match[0].length)); i++; continue; }
    if (next === '<' && match.groups) {
      const close = template.indexOf('>', i + 2);
      if (close !== -1) {
        const name = template.slice(i + 2, close);
        if (Object.hasOwn(match.groups, name)) { append(match.groups[name] ?? ''); i = close; continue; }
      }
    }
    if (next >= '1' && next <= '9') {
      const first = Number(next);
      const second = template[i + 2] >= '0' && template[i + 2] <= '9' ? Number(template[i + 2]) : 0;
      const twoDigit = first * 10 + second;
      if (twoDigit > 0 && twoDigit < match.length) { append(match[twoDigit] ?? ''); i += second ? 2 : 1; continue; }
      if (first < match.length) { append(match[first] ?? ''); i++; continue; }
    }
    append('$');
  }
  return chunks.join('');
}

const { pattern, flags, replacement, input } = payload;
const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
const matches = [];
const output = [];
let cursor = 0;
let outputSize = 0;
let truncated = false;
let match;
while ((match = regex.exec(input)) !== null) {
  if (matches.length >= MAX_MATCHES) { truncated = true; break; }
  const index = match.index;
  const prefix = input.slice(cursor, index);
  const replaced = expandReplacement(replacement, match, input);
  outputSize += prefix.length + replaced.length;
  if (outputSize > MAX_OUTPUT) throw new Error('OUTPUT_LIMIT');
  output.push(prefix, replaced);
  cursor = index + match[0].length;
  matches.push({ match: match[0], captures: match.slice(1).map((value) => value ?? null), index });
  if (match[0].length === 0) regex.lastIndex = advanceStringIndex(input, regex.lastIndex, regex.unicode);
}
output.push(input.slice(cursor));
const finalOutput = output.join('');
if (finalOutput.length > MAX_OUTPUT) throw new Error('OUTPUT_LIMIT');
({ matches, output: finalOutput, truncated });
`;

const compiledScript = new vm.Script(scriptSource);

export function runRegexTest(payload: RegexTestInput, timeoutMs = 250): Promise<RegexTestResult> {
  return new Promise((resolve, reject) => {
    try {
      const context = vm.createContext({ payload });
      const result = compiledScript.runInContext(context, { timeout: timeoutMs }) as RegexTestResult;
      resolve(result);
    } catch (error: any) {
      if (error && (error.code === "ERR_SCRIPT_EXECUTION_TIMEOUT" || String(error).includes("timed out") || String(error.message).includes("timed out"))) {
        reject(Object.assign(new Error("Regex execution timed out"), { code: "REGEX_TIMEOUT" }));
        return;
      }
      const message = String(error && error.message || error);
      if (message === "OUTPUT_LIMIT") {
        reject(Object.assign(new Error("Regex output exceeds limit"), { code: "OUTPUT_LIMIT" }));
        return;
      }
      if (error && (error.name === "SyntaxError" || error instanceof SyntaxError)) {
        reject(Object.assign(new Error("Invalid regex pattern"), { code: "INVALID_PATTERN" }));
        return;
      }
      reject(Object.assign(new Error("Regex execution failed"), { code: "WORKER_INTERNAL" }));
    }
  });
}
