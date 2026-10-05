import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import openApi from "./openapi.json" with { type: "json" };
import { getById, getCollection, getRecipeBundle, validateContent, type Lesson } from "./content.ts";
import { runRegexTest, type RegexTestInput } from "./regex-worker.ts";

const errorSchema = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message", "requestId"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        requestId: { type: "string" },
        details: {
          type: "array",
          items: {
            type: "object",
            required: ["field", "rule"],
            properties: {
              field: { type: "string" },
              rule: { type: "string" },
              limit: { type: "integer" },
            },
          },
        },
      },
    },
  },
};

const API_PREFIX = "/v1";

const listQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    q: { type: "string", maxLength: 100 },
    category: { type: "string", maxLength: 64 },
    level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
    locale: { type: "string", maxLength: 12 },
  },
};

const lessonListQuerySchema = {
  ...listQuerySchema,
  properties: {
    ...listQuerySchema.properties,
    audience: { type: "string", enum: ["app_user", "developer"] },
  },
};

const searchQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    term: { type: "string", maxLength: 100 },
    q: { type: "string", maxLength: 100 },
  },
};

const idParamsSchema = {
  type: "object",
  required: ["id"],
  additionalProperties: false,
  properties: { id: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", maxLength: 100 } },
};

const regexBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["pattern", "flags", "replacement", "input"],
  properties: {
    pattern: { type: "string", minLength: 1, maxLength: 2048 },
    flags: { type: "string", maxLength: 5, pattern: "^[gimsu]*$" },
    replacement: { type: "string", maxLength: 2048 },
    input: { type: "string", maxLength: 16384 },
  },
};

type ListQuery = { q?: string; category?: string; level?: string; locale?: string; audience?: "app_user" | "developer" };

export function buildApp(enableLogging = true): FastifyInstance {
  validateContent();
  const app = Fastify({
    logger: enableLogging ? {
      base: {},
      redact: ["req.headers.authorization", "req.headers.cookie", "req.body"],
    } : false,
    genReqId: () => randomUUID(),
    bodyLimit: 24 * 1024,
  });
  let activeRegexWorkers = 0;

  app.setErrorHandler((error, request, reply) => {
    const validation = (error as Error & {
      validation?: Array<{
        instancePath?: string;
        keyword?: string;
        params?: { limit?: number; missingProperty?: string };
      }>;
    }).validation;
    if (validation) {
      const details = validation.map((issue) => ({
        field: issue.params?.missingProperty ?? issue.instancePath?.replace(/^\//, "").replace(/~1/g, "/").replace(/~0/g, "~") ?? "body",
        rule: issue.keyword ?? "validation",
        ...(typeof issue.params?.limit === "number" ? { limit: issue.params.limit } : {}),
      }));
      return reply.code(400).send({
        error: { code: "INVALID_REQUEST", message: "Request does not match the API schema", requestId: request.id, details },
      });
    }
    request.log.error({ err: error, requestId: request.id }, "Request failed");
    return reply.code(500).send({
      error: { code: "INTERNAL_ERROR", message: "The request could not be completed", requestId: request.id },
    });
  });

  const loadStatic = async (name: string) => {
    for (const candidate of [join(process.cwd(), "public", name), join(process.cwd(), "dist", name), join(process.cwd(), name)]) {
      try {
        return await readFile(candidate);
      } catch {}
    }
    throw new Error(`File ${name} not found`);
  };

  app.get("/healthz", async () => ({ status: "ok", contentVersion: "0.1.0" }));
  app.get("/cookbook.js", async (_request, reply) => {
    try {
      const script = await loadStatic("cookbook.js");
      return reply.type("application/javascript; charset=utf-8").send(script);
    } catch {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Script not found" } });
    }
  });
  app.get("/bg.jpg", async (_request, reply) => {
    try {
      const img = await loadStatic("bg.jpg");
      return reply.type("image/jpeg").send(img);
    } catch {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Background image not found" } });
    }
  });
  app.get("/mascot.jpg", async (_request, reply) => {
    try {
      const img = await loadStatic("mascot.jpg");
      return reply.type("image/jpeg").send(img);
    } catch {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Mascot image not found" } });
    }
  });
  app.get(`${API_PREFIX}/openapi.json`, async () => openApi);

  app.get("/", async (_request, reply) => {
    try {
      const html = await loadStatic("index.html");
      return reply.type("text/html; charset=utf-8").send(html);
    } catch {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Web interface not found" } });
    }
  });

  app.get("/index.html", async (_request, reply) => {
    try {
      const html = await loadStatic("index.html");
      return reply.type("text/html; charset=utf-8").send(html);
    } catch {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Web interface not found" } });
    }
  });

  app.get("/api/index", async (_request, reply) => {
    try {
      const html = await loadStatic("index.html");
      return reply.type("text/html; charset=utf-8").send(html);
    } catch {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Web interface not found" } });
    }
  });

  app.get("/api", async (_request, reply) => {
    try {
      const html = await loadStatic("index.html");
      return reply.type("text/html; charset=utf-8").send(html);
    } catch {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Web interface not found" } });
    }
  });

  app.get(`${API_PREFIX}/search`, {
    schema: { querystring: searchQuerySchema },
  }, async (request) => {
    const query = request.query as { term?: string; q?: string };
    const term = (query.term ?? query.q ?? "").toLocaleLowerCase("th").trim();

    const filterCollection = (kind: "lessons" | "patterns" | "recipes") => {
      if (!term) return getCollection(kind);
      return getCollection(kind).filter((item) => {
        const record = item as Record<string, unknown>;
        const searchTarget = `${record.title ?? ""} ${record.summary ?? ""} ${record.pattern ?? ""}`.toLocaleLowerCase("th");
        return searchTarget.includes(term);
      });
    };

    const patterns = filterCollection("patterns");
    const recipes = filterCollection("recipes");
    const lessons = filterCollection("lessons");

    return {
      data: {
        patterns,
        recipes,
        lessons,
      },
      meta: {
        query: term,
        totalCount: patterns.length + recipes.length + lessons.length,
        contentVersion: "0.1.0",
      },
    };
  });

  for (const kind of ["lessons", "patterns", "recipes"] as const) {
    app.get(`${API_PREFIX}/${kind}`, {
      schema: { querystring: kind === "lessons" ? lessonListQuerySchema : listQuerySchema },
    }, async (request) => {
      const query = request.query as ListQuery;
      const q = query.q?.toLocaleLowerCase("th");
      const data = getCollection(kind).filter((item) => {
        const record = item as Record<string, unknown>;
        const matchesQ = !q || `${record.title} ${record.summary}`.toLocaleLowerCase("th").includes(q);
        const matchesCategory = !query.category || record.category === query.category;
        const matchesLevel = !query.level || record.level === query.level;
        const matchesLocale = !query.locale || record.locale === query.locale;
        return matchesQ && matchesCategory && matchesLevel && matchesLocale;
      });
      const output = kind === "lessons" && query.audience
        ? data.map((item) => {
          const audienceNotes = (item as Lesson).audienceNotes;
          return { ...item, audienceNotes: { [query.audience!]: audienceNotes[query.audience!] } };
        })
        : data;
      return { data: output, meta: { count: data.length, contentVersion: "0.1.0", audience: query.audience } };
    });

    app.get(`${API_PREFIX}/${kind}/:id`, { schema: { params: idParamsSchema, response: { 404: errorSchema } } }, async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = getById(kind, id);
      if (!data) {
        return reply.code(404).send({ error: { code: "NOT_FOUND", message: `${kind} item not found`, requestId: request.id } });
      }
      return { data, meta: { contentVersion: "0.1.0" } };
    });
  }

  app.get(`${API_PREFIX}/recipes/:id/export`, { schema: { params: idParamsSchema } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = getRecipeBundle(id);
    if (!data) {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Recipe not found", requestId: request.id } });
    }
    return { data };
  });

  app.post<{ Body: RegexTestInput }>(`${API_PREFIX}/regex/test`, {
    schema: { body: regexBodySchema },
  }, async (request, reply) => {
    const { pattern, flags, replacement, input } = request.body;
    if (new Set(flags).size !== flags.length) {
      return reply.code(400).send({ error: { code: "INVALID_REQUEST", message: "Regex flags must not repeat", requestId: request.id } });
    }
    if (Buffer.byteLength(input, "utf8") > 16 * 1024) {
      return reply.code(413).send({ error: { code: "INPUT_TOO_LARGE", message: "Input exceeds 16 KiB", requestId: request.id } });
    }
    if (activeRegexWorkers >= 4) {
      return reply.code(429).send({ error: { code: "REGEX_BUSY", message: "All Regex workers are busy; retry shortly", requestId: request.id } });
    }
    activeRegexWorkers++;
    try {
      const result = await runRegexTest({ pattern, flags, replacement, input });
      return { data: result, meta: { engine: `Node.js ${process.versions.node} RegExp`, contentVersion: "0.1.0" } };
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "OUTPUT_LIMIT") {
        return reply.code(422).send({ error: { code: "OUTPUT_TOO_LARGE", message: "Regex output exceeds 64 KiB", requestId: request.id } });
      }
      if (code === "REGEX_TIMEOUT") {
        return reply.code(422).send({ error: { code: "REGEX_TIMEOUT", message: "Regex exceeded the execution time limit", requestId: request.id } });
      }
      if (code === "REGEX_WORKER_FAILED") {
        request.log.error({ code }, "Regex worker failed to start");
        return reply.code(503).send({ error: { code: "REGEX_WORKER_FAILED", message: "Regex preview is temporarily unavailable", requestId: request.id } });
      }
      if (code === "WORKER_INTERNAL") {
        request.log.error({ code, errorType: (error as Error & { cause?: unknown }).cause }, "Regex execution failed inside worker");
        return reply.code(503).send({ error: { code: "REGEX_WORKER_FAILED", message: "Regex preview is temporarily unavailable", requestId: request.id } });
      }
      return reply.code(422).send({ error: { code: "INVALID_REGEX", message: "Pattern or flags are not supported by this engine", requestId: request.id } });
    } finally {
      activeRegexWorkers--;
    }
  });

  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith("/v1/") || request.url === "/healthz") {
      return reply.code(404).send({
        error: { code: "NOT_FOUND", message: "Route not found", requestId: request.id },
      });
    }
    try {
      const html = await loadStatic("index.html");
      return reply.type("text/html; charset=utf-8").send(html);
    } catch {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Web interface not found" } });
    }
  });

  return app;
}

export default buildApp;
