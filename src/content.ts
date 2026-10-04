import { Ajv } from "ajv";
import lessons from "../content/lessons.json" with { type: "json" };
import patterns from "../content/patterns.json" with { type: "json" };
import recipes from "../content/recipes.json" with { type: "json" };
import styles from "../content/styles.json" with { type: "json" };
import sources from "../content/sources.json" with { type: "json" };

export type Lesson = {
  id: string;
  courseOrder: number;
  courseStage: string;
  schemaVersion: number;
  revision: number;
  locale: string;
  status: "published" | "draft";
  title: string;
  summary: string;
  tldr?: string;
  intro?: string;
  context?: {
    who?: string;
    what?: string;
    where?: string;
    when?: string;
    why?: string;
    how?: string[];
  };
  beforeAfter?: {
    before: string;
    after: string;
    explanation?: string;
  };
  level: "beginner" | "intermediate" | "advanced";
  category: string;
  audiences: Array<"app_user" | "developer">;
  audienceNotes: { app_user: string; developer: string };
  sections: Array<{ heading: string; body: string }>;
  exercises: Array<{ prompt: string; answer: string }>;
  sourceRefs: string[];
  practicePatternId?: string;
};

export type Pattern = {
  id: string;
  schemaVersion: number;
  revision: number;
  locale: string;
  status: "published" | "draft";
  title: string;
  summary: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  pattern: string;
  flags: string;
  replacement: string;
  applyTo: "all" | "user" | "character";
  matchStage: "raw" | "displayed_text";
  captureGroups: Array<{ index: number; meaning: string }>;
  explanation: string[];
  instructions: string[];
  examples: Array<{
    input: string;
    expectedMatches: string[];
    expectedCaptures: string[][];
    expectedOutput: string;
  }>;
  limitations: string[];
  sourceRefs: string[];
};

export type Style = {
  id: string;
  tagName: string;
  template: string;
  css: string;
  applyTo: "all" | "user" | "character";
};

export type Recipe = {
  id: string;
  schemaVersion: number;
  revision: number;
  locale: string;
  status: "published" | "draft";
  title: string;
  summary: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  settingInstructions: string[];
  openingExample: string;
  patternRefs: string[];
  styleRefs: string[];
  ruleOrder: Array<{ kind: "pattern" | "style"; id: string }>;
  installationSteps: string[];
  sourceRefs: string[];
};

export type Source = {
  id: string;
  title: string;
  url: string;
  checkedAt: string;
  notes: string;
};

const content = {
  lessons: lessons as Lesson[],
  patterns: patterns as Pattern[],
  recipes: recipes as Recipe[],
  styles: styles as Style[],
  sources: sources as Source[],
};

const ajv = new Ajv({ allErrors: true, strict: false });
const itemSchema = {
  type: "object",
  required: ["id", "schemaVersion", "revision", "locale", "status", "title", "summary"],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
    schemaVersion: { type: "integer", minimum: 1 },
    revision: { type: "integer", minimum: 1 },
    locale: { type: "string", minLength: 2 },
    status: { enum: ["published", "draft"] },
    title: { type: "string", minLength: 1 },
    summary: { type: "string", minLength: 1 },
  },
};

export function validateContent(): void {
  const validateItem = ajv.compile(itemSchema);
  const isValidItem = validateItem as unknown as (data: unknown) => boolean;
  const allIds = new Set<string>();

  for (const collection of [content.lessons, content.patterns, content.recipes, content.styles]) {
    for (const item of collection) {
      if (!isValidItem(item)) {
        throw new Error(`Invalid content item ${item.id}: ${ajv.errorsText(validateItem.errors)}`);
      }
      if (allIds.has(item.id)) throw new Error(`Duplicate content id: ${item.id}`);
      allIds.add(item.id);
    }
  }
  for (const lesson of content.lessons) {
    if (lesson.practicePatternId && !content.patterns.some((pattern) => pattern.id === lesson.practicePatternId && pattern.status === "published")) {
      throw new Error(`${lesson.id} references unknown practice pattern ${lesson.practicePatternId}`);
    }
    if (!lesson.audiences.includes("app_user") || !lesson.audiences.includes("developer")) {
      throw new Error(`${lesson.id} must include both reader tracks`);
    }
    if (!lesson.audienceNotes.app_user || !lesson.audienceNotes.developer) {
      throw new Error(`${lesson.id} is missing a reader-specific explanation`);
    }
  }

  const sourceIds = new Set(content.sources.map((source) => source.id));
  for (const source of content.sources) {
    if (!source.id || !source.url.startsWith("https://")) throw new Error("Invalid source record");
  }
  for (const item of [...content.lessons, ...content.patterns, ...content.recipes]) {
    for (const sourceId of item.sourceRefs) {
      if (!sourceIds.has(sourceId)) throw new Error(`${item.id} references unknown source ${sourceId}`);
    }
  }
  for (const pattern of content.patterns) {
    try {
      new RegExp(pattern.pattern, pattern.flags);
    } catch (error) {
      throw new Error(`Invalid regex in ${pattern.id}: ${String(error)}`);
    }
  }
  for (const style of content.styles) {
    if (!style.tagName || !style.template.includes("$1")) throw new Error(`Invalid style template: ${style.id}`);
  }
  for (const recipe of content.recipes) {
    for (const id of recipe.patternRefs) if (!content.patterns.some((pattern) => pattern.id === id)) throw new Error(`${recipe.id} references unknown pattern ${id}`);
    for (const id of recipe.styleRefs) if (!content.styles.some((style) => style.id === id)) throw new Error(`${recipe.id} references unknown style ${id}`);
    for (const rule of recipe.ruleOrder) {
      const found = rule.kind === "pattern" ? recipe.patternRefs.includes(rule.id) : recipe.styleRefs.includes(rule.id);
      if (!found) throw new Error(`${recipe.id} has invalid rule order reference ${rule.id}`);
    }
  }
}

export function getCollection(kind: "lessons" | "patterns" | "recipes") {
  const published = content[kind].filter((item) => item.status === "published");
  if (kind === "lessons") {
    published.sort((a, b) => {
      const firstOrder = (a as Lesson).courseOrder ?? Number.MAX_SAFE_INTEGER;
      const secondOrder = (b as Lesson).courseOrder ?? Number.MAX_SAFE_INTEGER;
      return firstOrder - secondOrder;
    });
  } else if (kind === "patterns") {
    published.sort((a, b) => Number(b.id === "key-value-generic") - Number(a.id === "key-value-generic"));
  }
  return published;
}

export function getById(kind: "lessons" | "patterns" | "recipes", id: string) {
  return getCollection(kind).find((item) => item.id === id);
}

export function getRecipeBundle(id: string) {
  const recipe = content.recipes.find((entry) => entry.id === id && entry.status === "published");
  if (!recipe) return undefined;
  return {
    contentVersion: "0.1.0",
    recipe,
    patterns: recipe.patternRefs.map((ref) => getById("patterns", ref)),
    styles: recipe.styleRefs.map((ref) => content.styles.find((style) => style.id === ref)),
  };
}
