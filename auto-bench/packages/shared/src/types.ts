import { z } from "zod";
import {
  ArtifactSchema,
  MatchSchema,
  RatingSchema,
  SubmissionSchema,
  TaskRuntimeSchema,
  TaskSpecSchema,
  VotePayloadSchema
} from "./schemas";

export type TaskRuntime = z.infer<typeof TaskRuntimeSchema>;
export type TaskSpec = z.infer<typeof TaskSpecSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
export type ArtifactRecord = z.infer<typeof ArtifactSchema>;
export type Match = z.infer<typeof MatchSchema>;
export type Rating = z.infer<typeof RatingSchema>;
export type VotePayload = z.infer<typeof VotePayloadSchema>;

const FORBIDDEN_PATTERNS = ["eval(", "Function(", "document.write", "document.createElement('script')"];

export function sanitizeSubmissionCode(code: string): string {
  // Strip markdown code fences
  let cleaned = code.trim();
  
  // Remove opening fence (```javascript, ```js, ```typescript, etc.)
  cleaned = cleaned.replace(/^```(?:javascript|js|typescript|ts)?\s*\n?/i, '');
  
  // Remove closing fence
  cleaned = cleaned.replace(/\n?```\s*$/, '');
  
  cleaned = cleaned.trim();
  
  if (FORBIDDEN_PATTERNS.some((term) => cleaned.includes(term))) {
    throw new Error("Submission code contains forbidden pattern");
  }
  return cleaned;
}

export function eloExpected(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}
