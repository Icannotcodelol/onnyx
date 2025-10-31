"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ArtifactSchema: () => ArtifactSchema,
  MatchSchema: () => MatchSchema,
  RatingSchema: () => RatingSchema,
  SubmissionSchema: () => SubmissionSchema,
  TaskRuntimeSchema: () => TaskRuntimeSchema,
  TaskSpecSchema: () => TaskSpecSchema,
  VotePayloadSchema: () => VotePayloadSchema,
  eloExpected: () => eloExpected,
  sanitizeSubmissionCode: () => sanitizeSubmissionCode
});
module.exports = __toCommonJS(src_exports);

// src/schemas.ts
var import_zod = require("zod");
var TaskRuntimeSchema = import_zod.z.enum(["js-browser", "js-server", "python"]);
var TaskSpecSchema = import_zod.z.object({
  id: import_zod.z.string().uuid().optional(),
  slug: import_zod.z.string().min(3),
  title: import_zod.z.string().min(3),
  summary: import_zod.z.string().min(8),
  runtime: TaskRuntimeSchema,
  instructions: import_zod.z.string().min(10),
  acceptanceCriteria: import_zod.z.array(import_zod.z.string().min(3)),
  starter: import_zod.z.object({
    language: import_zod.z.enum(["typescript", "javascript", "python"]),
    code: import_zod.z.string()
  })
});
var SubmissionSchema = import_zod.z.object({
  id: import_zod.z.string().uuid(),
  task_id: import_zod.z.string().uuid(),
  model_id: import_zod.z.string().uuid(),
  prompt: import_zod.z.string(),
  code: import_zod.z.string().nullable(),
  status: import_zod.z.enum(["queued", "running", "succeeded", "failed"]),
  error: import_zod.z.string().nullable().optional(),
  metrics: import_zod.z.record(import_zod.z.any()).optional(),
  created_at: import_zod.z.string(),
  model: import_zod.z.object({
    label: import_zod.z.string(),
    provider: import_zod.z.string()
  }).optional()
});
var ArtifactSchema = import_zod.z.object({
  id: import_zod.z.string().uuid(),
  submission_id: import_zod.z.string().uuid(),
  kind: import_zod.z.enum(["image", "video", "log"]),
  storage_path: import_zod.z.string(),
  width: import_zod.z.number().nullable(),
  height: import_zod.z.number().nullable(),
  duration_ms: import_zod.z.number().nullable(),
  harness_html: import_zod.z.string().nullable().optional()
});
var MatchSchema = import_zod.z.object({
  id: import_zod.z.string().uuid(),
  task_id: import_zod.z.string().uuid(),
  submission_a: import_zod.z.string().uuid().nullable(),
  submission_b: import_zod.z.string().uuid().nullable(),
  created_at: import_zod.z.string()
});
var RatingSchema = import_zod.z.object({
  model_id: import_zod.z.string().uuid(),
  rating: import_zod.z.number(),
  model_label: import_zod.z.string().optional(),
  provider_name: import_zod.z.string().optional(),
  sparkline: import_zod.z.array(import_zod.z.number()).optional()
});
var VotePayloadSchema = import_zod.z.object({
  matchId: import_zod.z.string().uuid(),
  winnerSubmissionId: import_zod.z.string().uuid(),
  loserSubmissionId: import_zod.z.string().uuid()
});

// src/types.ts
var FORBIDDEN_PATTERNS = ["eval(", "Function(", "document.write", "document.createElement('script')"];
function sanitizeSubmissionCode(code) {
  let cleaned = code.trim();
  cleaned = cleaned.replace(/^```(?:javascript|js|typescript|ts)?\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?```\s*$/, "");
  cleaned = cleaned.trim();
  if (FORBIDDEN_PATTERNS.some((term) => cleaned.includes(term))) {
    throw new Error("Submission code contains forbidden pattern");
  }
  return cleaned;
}
function eloExpected(a, b) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArtifactSchema,
  MatchSchema,
  RatingSchema,
  SubmissionSchema,
  TaskRuntimeSchema,
  TaskSpecSchema,
  VotePayloadSchema,
  eloExpected,
  sanitizeSubmissionCode
});
