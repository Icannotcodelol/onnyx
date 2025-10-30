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

const FORBIDDEN_PATTERNS = ["fetch", "WebSocket", "document.createElement('script')", "navigator"];

export function sanitizeSubmissionCode(code: string): string {
  if (FORBIDDEN_PATTERNS.some((term) => code.includes(term))) {
    throw new Error("Submission code contains forbidden pattern");
  }
  return code;
}

export function eloExpected(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}
