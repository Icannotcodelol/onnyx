import { describe, expect, it } from "vitest";
import { TaskSpecSchema } from "./schemas";
import { eloExpected, sanitizeSubmissionCode } from "./types";

describe("TaskSpecSchema", () => {
  it("rejects invalid runtime", () => {
    expect(() =>
      TaskSpecSchema.parse({
        slug: "demo",
        title: "Demo",
        summary: "Example",
        runtime: "invalid",
        instructions: "do things",
        acceptanceCriteria: ["works"],
        starter: { language: "typescript", code: "" }
      })
    ).toThrow();
  });
});

describe("eloExpected", () => {
  it("matches known result", () => {
    const expected = eloExpected(1600, 1500);
    expect(expected).toBeCloseTo(0.640, 3);
  });
});

describe("sanitizeSubmissionCode", () => {
  it("throws when forbidden pattern", () => {
    expect(() => sanitizeSubmissionCode("fetch('https://example.com')")).toThrow();
  });

  it("passes safe code", () => {
    expect(sanitizeSubmissionCode("console.log('ok');")).toEqual("console.log('ok');");
  });
});
