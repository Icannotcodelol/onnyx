import { z } from 'zod';

declare const TaskRuntimeSchema: z.ZodEnum<["js-browser", "js-server", "python"]>;
declare const TaskSpecSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    title: z.ZodString;
    summary: z.ZodString;
    runtime: z.ZodEnum<["js-browser", "js-server", "python"]>;
    instructions: z.ZodString;
    acceptanceCriteria: z.ZodArray<z.ZodString, "many">;
    starter: z.ZodObject<{
        language: z.ZodEnum<["typescript", "javascript", "python"]>;
        code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        language: "python" | "typescript" | "javascript";
    }, {
        code: string;
        language: "python" | "typescript" | "javascript";
    }>;
}, "strip", z.ZodTypeAny, {
    slug: string;
    title: string;
    summary: string;
    runtime: "js-browser" | "js-server" | "python";
    instructions: string;
    acceptanceCriteria: string[];
    starter: {
        code: string;
        language: "python" | "typescript" | "javascript";
    };
    id?: string | undefined;
}, {
    slug: string;
    title: string;
    summary: string;
    runtime: "js-browser" | "js-server" | "python";
    instructions: string;
    acceptanceCriteria: string[];
    starter: {
        code: string;
        language: "python" | "typescript" | "javascript";
    };
    id?: string | undefined;
}>;
declare const SubmissionSchema: z.ZodObject<{
    id: z.ZodString;
    task_id: z.ZodString;
    model_id: z.ZodString;
    prompt: z.ZodString;
    code: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["queued", "running", "succeeded", "failed"]>;
    error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    metrics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    created_at: z.ZodString;
    model: z.ZodOptional<z.ZodObject<{
        label: z.ZodString;
        provider: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
        provider: string;
    }, {
        label: string;
        provider: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "queued" | "running" | "succeeded" | "failed";
    code: string | null;
    task_id: string;
    model_id: string;
    prompt: string;
    created_at: string;
    error?: string | null | undefined;
    metrics?: Record<string, any> | undefined;
    model?: {
        label: string;
        provider: string;
    } | undefined;
}, {
    id: string;
    status: "queued" | "running" | "succeeded" | "failed";
    code: string | null;
    task_id: string;
    model_id: string;
    prompt: string;
    created_at: string;
    error?: string | null | undefined;
    metrics?: Record<string, any> | undefined;
    model?: {
        label: string;
        provider: string;
    } | undefined;
}>;
declare const ArtifactSchema: z.ZodObject<{
    id: z.ZodString;
    submission_id: z.ZodString;
    kind: z.ZodEnum<["image", "video", "log"]>;
    storage_path: z.ZodString;
    width: z.ZodNullable<z.ZodNumber>;
    height: z.ZodNullable<z.ZodNumber>;
    duration_ms: z.ZodNullable<z.ZodNumber>;
    harness_html: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    submission_id: string;
    kind: "image" | "video" | "log";
    storage_path: string;
    width: number | null;
    height: number | null;
    duration_ms: number | null;
    harness_html?: string | null | undefined;
}, {
    id: string;
    submission_id: string;
    kind: "image" | "video" | "log";
    storage_path: string;
    width: number | null;
    height: number | null;
    duration_ms: number | null;
    harness_html?: string | null | undefined;
}>;
declare const MatchSchema: z.ZodObject<{
    id: z.ZodString;
    task_id: z.ZodString;
    submission_a: z.ZodNullable<z.ZodString>;
    submission_b: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    task_id: string;
    created_at: string;
    submission_a: string | null;
    submission_b: string | null;
}, {
    id: string;
    task_id: string;
    created_at: string;
    submission_a: string | null;
    submission_b: string | null;
}>;
declare const RatingSchema: z.ZodObject<{
    model_id: z.ZodString;
    rating: z.ZodNumber;
    model_label: z.ZodOptional<z.ZodString>;
    provider_name: z.ZodOptional<z.ZodString>;
    sparkline: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    model_id: string;
    rating: number;
    model_label?: string | undefined;
    provider_name?: string | undefined;
    sparkline?: number[] | undefined;
}, {
    model_id: string;
    rating: number;
    model_label?: string | undefined;
    provider_name?: string | undefined;
    sparkline?: number[] | undefined;
}>;
declare const VotePayloadSchema: z.ZodObject<{
    matchId: z.ZodString;
    winnerSubmissionId: z.ZodString;
    loserSubmissionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    matchId: string;
    winnerSubmissionId: string;
    loserSubmissionId: string;
}, {
    matchId: string;
    winnerSubmissionId: string;
    loserSubmissionId: string;
}>;

type TaskRuntime = z.infer<typeof TaskRuntimeSchema>;
type TaskSpec = z.infer<typeof TaskSpecSchema>;
type Submission = z.infer<typeof SubmissionSchema>;
type ArtifactRecord = z.infer<typeof ArtifactSchema>;
type Match = z.infer<typeof MatchSchema>;
type Rating = z.infer<typeof RatingSchema>;
type VotePayload = z.infer<typeof VotePayloadSchema>;
declare function sanitizeSubmissionCode(code: string): string;
declare function eloExpected(a: number, b: number): number;

export { type ArtifactRecord, ArtifactSchema, type Match, MatchSchema, type Rating, RatingSchema, type Submission, SubmissionSchema, type TaskRuntime, TaskRuntimeSchema, type TaskSpec, TaskSpecSchema, type VotePayload, VotePayloadSchema, eloExpected, sanitizeSubmissionCode };
