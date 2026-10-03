import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.ts";
import patterns from "../content/patterns.json" with { type: "json" };

let app: FastifyInstance;

before(() => {
  app = buildApp(false);
});

after(async () => {
  await app.close();
});

describe("content API", () => {
  it("serves health and the OpenAPI contract", async () => {
    const health = await app.inject({ method: "GET", url: "/healthz" });
    assert.equal(health.statusCode, 200);
    assert.equal(health.json().status, "ok");

    const spec = await app.inject({ method: "GET", url: "/v1/openapi.json" });
    assert.equal(spec.statusCode, 200);
    assert.equal(spec.json().openapi, "3.1.0");
    assert.ok(spec.json().paths["/v1/regex/test"]);
    assert.ok(spec.json().components.pathItems.listLessons.get.parameters.some(
      (parameter: { $ref?: string }) => parameter.$ref === "#/components/parameters/Audience",
    ));
  });

  it("filters published lessons and returns their detail", async () => {
    const list = await app.inject({ method: "GET", url: "/v1/lessons?q=regex&locale=th-TH&audience=app_user" });
    assert.equal(list.statusCode, 200);
    assert.ok(list.json().data.length > 0);
    assert.ok(list.json().data.every((lesson: { locale: string }) => lesson.locale === "th-TH"));
    assert.deepEqual(Object.keys(list.json().data[0].audienceNotes), ["app_user"]);

    const developerList = await app.inject({ method: "GET", url: "/v1/lessons?audience=developer" });
    assert.equal(developerList.statusCode, 200);
    assert.deepEqual(Object.keys(developerList.json().data[0].audienceNotes), ["developer"]);

    const detail = await app.inject({ method: "GET", url: "/v1/lessons/regex-introduction" });
    assert.equal(detail.statusCode, 200);
    assert.equal(detail.json().data.id, "regex-introduction");
  });

  it("returns a recipe bundle with all referenced content", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/recipes/dialogue-and-actions/export" });
    assert.equal(response.statusCode, 200);
    const bundle = response.json().data;
    assert.equal(bundle.recipe.id, "dialogue-and-actions");
    assert.equal(bundle.patterns[0].id, "parenthetical-action");
    assert.equal(bundle.styles[0].id, "action-style");
  });

  it("returns a consistent 404 for missing content", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/patterns/not-a-pattern" });
    assert.equal(response.statusCode, 404);
    assert.equal(response.json().error.code, "NOT_FOUND");
    assert.ok(response.json().error.requestId);
  });
});

describe("Regex preview", () => {
  it("keeps the catalog pattern examples accurate for JavaScript RegExp", () => {
    for (const pattern of patterns) {
      for (const example of pattern.examples) {
        const globalFlags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
        const matches = Array.from(example.input.matchAll(new RegExp(pattern.pattern, globalFlags)));
        assert.deepEqual(matches.map((match) => match[0]), example.expectedMatches, pattern.id);
        if (example.expectedCaptures.length > 0) {
          assert.deepEqual(matches.map((match) => match.slice(1)), example.expectedCaptures, pattern.id);
        }
        assert.equal(example.input.replace(new RegExp(pattern.pattern, pattern.flags), pattern.replacement), example.expectedOutput, pattern.id);
      }
    }
  });

  it("returns matches, captures, and replacement output", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/regex/test",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({
        pattern: "Affection[:：]\\s*(\\d{1,3})",
        flags: "gi",
        replacement: "Affection: $1",
        input: "Affection: 72",
      }),
    });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json().data.matches[0].captures, ["72"]);
    assert.equal(response.json().data.output, "Affection: 72");
  });

  it("rejects malformed requests and invalid patterns", async () => {
    const badFlags = await app.inject({
      method: "POST", url: "/v1/regex/test",
      payload: { pattern: "a", flags: "gg", replacement: "b", input: "a" },
    });
    assert.equal(badFlags.statusCode, 400);

    const invalidRegex = await app.inject({
      method: "POST", url: "/v1/regex/test",
      payload: { pattern: "[", flags: "", replacement: "", input: "text" },
    });
    assert.equal(invalidRegex.statusCode, 422);
    assert.equal(invalidRegex.json().error.code, "INVALID_REGEX");
  });

  it("enforces the UTF-8 input byte limit", async () => {
    const response = await app.inject({
      method: "POST", url: "/v1/regex/test",
      payload: { pattern: "a", flags: "", replacement: "", input: "ก".repeat(5500) },
    });
    assert.equal(response.statusCode, 413);
    assert.equal(response.json().error.code, "INPUT_TOO_LARGE");
  });

  it("enforces the output size limit", async () => {
    const response = await app.inject({
      method: "POST", url: "/v1/regex/test",
      payload: { pattern: "a", flags: "g", replacement: "$'".repeat(1024), input: "a".repeat(100) },
    });
    assert.equal(response.statusCode, 422);
    assert.equal(response.json().error.code, "OUTPUT_TOO_LARGE");
  });

  it("advances safely after zero-length matches", async () => {
    const response = await app.inject({
      method: "POST", url: "/v1/regex/test",
      payload: { pattern: "(?=a)", flags: "g", replacement: "x", input: "aa" },
    });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.output, "xaxa");
    assert.equal(response.json().data.matches.length, 2);
  });

  it("stops a pathological expression at the worker deadline", async () => {
    const response = await app.inject({
      method: "POST", url: "/v1/regex/test",
      payload: { pattern: "^(a+)+$", flags: "", replacement: "", input: `${"a".repeat(16000)}!` },
    });
    assert.equal(response.statusCode, 422);
    assert.equal(response.json().error.code, "REGEX_TIMEOUT");
  });
});
