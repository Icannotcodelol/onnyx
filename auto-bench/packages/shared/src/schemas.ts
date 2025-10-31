import { z } from "zod";

export const TaskRuntimeSchema = z.enum(["js-browser", "js-server", "python"]);

export const TaskSpecSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(3),
  title: z.string().min(3),
  summary: z.string().min(8),
  runtime: TaskRuntimeSchema,
  instructions: z.string().min(10),
  acceptanceCriteria: z.array(z.string().min(3)),
  starter: z.object({
    language: z.enum(["typescript", "javascript", "python"]),
    code: z.string()
  })
});

export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  model_id: z.string().uuid(),
  prompt: z.string(),
  code: z.string().nullable(),
  status: z.enum(["queued", "running", "succeeded", "failed"]),
  error: z.string().nullable().optional(),
  metrics: z.record(z.any()).optional(),
  created_at: z.string(),
  model: z
    .object({
      label: z.string(),
      provider: z.string()
    })
    .optional()
});

export const ArtifactSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  kind: z.enum(["image", "video", "log"]),
  storage_path: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  duration_ms: z.number().nullable(),
  harness_html: z.string().nullable().optional()
});

export const MatchSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  submission_a: z.string().uuid().nullable(),
  submission_b: z.string().uuid().nullable(),
  created_at: z.string()
});

export const RatingSchema = z.object({
  model_id: z.string().uuid(),
  rating: z.number(),
  model_label: z.string().optional(),
  provider_name: z.string().optional(),
  sparkline: z.array(z.number()).optional()
});

export const VotePayloadSchema = z.object({
  matchId: z.string().uuid(),
  winnerSubmissionId: z.string().uuid(),
  loserSubmissionId: z.string().uuid()
});
