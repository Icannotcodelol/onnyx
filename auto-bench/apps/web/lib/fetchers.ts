import { cache } from "react";
import { supabaseServer } from "./supabaseClient";
import {
  ArtifactRecord,
  ArtifactSchema,
  Match,
  MatchSchema,
  Rating,
  RatingSchema,
  Submission,
  SubmissionSchema,
  TaskSpec,
  TaskSpecSchema
} from "@/shared/index";

const mapPublicUrl = (path: string) => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  return `${base}/storage/v1/object/public/artifacts/${path}`;
};

export const getTodaysTasks = cache(async (): Promise<TaskSpec[]> => {
  const client = supabaseServer();
  const { data, error } = await client
    .from("tasks")
    .select("id, title, spec, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) throw error;

  return (data ?? []).map((row) =>
    TaskSpecSchema.parse({ ...row.spec, id: row.id })
  );
});

export const getTaskDetail = cache(async (taskId: string) => {
  const client = supabaseServer();
  const { data: task, error } = await client
    .from("tasks")
    .select("id, title, spec, created_at")
    .eq("id", taskId)
    .single();
  if (error) throw error;
  const parsedTask = TaskSpecSchema.parse({ ...task.spec, id: task.id });

  const { data: submissions, error: subErr } = await client
    .from("submissions")
    .select("id, task_id, model_id, prompt, code, status, metrics, created_at, models(label, model_providers(name))")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (subErr) throw subErr;

  const parsedSubmissions: Submission[] = (submissions ?? []).map((item) =>
    SubmissionSchema.parse({
      ...item,
      model: {
        label: item.models?.label ?? "Unknown",
        provider: item.models?.model_providers?.name ?? ""
      }
    })
  );

  const submissionIds = parsedSubmissions.map((submission) => submission.id);

  let artifactRecords: ArtifactRecord[] = [];
  if (submissionIds.length > 0) {
    const { data: artifacts, error: artErr } = await client
      .from("artifacts")
      .select("id, submission_id, kind, storage_path, width, height, duration_ms")
      .in("submission_id", submissionIds);
    if (artErr) throw artErr;
    artifactRecords = (artifacts ?? []).map((item) => {
      const parsed = ArtifactSchema.parse(item);
      return {
        ...parsed,
        storage_path: mapPublicUrl(parsed.storage_path)
      };
    });
  }

  return { task: parsedTask, submissions: parsedSubmissions, artifacts: artifactRecords };
});

export const getArenaMatches = cache(
  async (): Promise<(Match & { submissions: Submission[]; artifacts: ArtifactRecord[] })[]> => {
  const client = supabaseServer();
  const { data, error } = await client
    .from("matches")
    .select("id, task_id, submission_a, submission_b, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw error;

  const matches = (data ?? []).map((item) => MatchSchema.parse(item));
  const submissionIds = matches
    .flatMap((match) => [match.submission_a, match.submission_b])
    .filter(Boolean) as string[];

  let parsedSubmissions: Submission[] = [];
  if (submissionIds.length > 0) {
    const { data: submissions, error: subErr } = await client
      .from("submissions")
      .select("id, task_id, model_id, prompt, code, status, metrics, created_at, models(label, model_providers(name))")
      .in("id", submissionIds);
    if (subErr) throw subErr;

    parsedSubmissions = (submissions ?? []).map((item) =>
      SubmissionSchema.parse({
        ...item,
        model: {
          label: item.models?.label ?? "Unknown",
          provider: item.models?.model_providers?.name ?? ""
        }
      })
    );
  }

  let artifactRecords: ArtifactRecord[] = [];
  if (submissionIds.length > 0) {
    const { data: artifacts, error: artErr } = await client
      .from("artifacts")
      .select("id, submission_id, kind, storage_path, width, height, duration_ms")
      .in("submission_id", submissionIds);
    if (artErr) throw artErr;

    artifactRecords = (artifacts ?? []).map((item) => {
      const parsed = ArtifactSchema.parse(item);
      return { ...parsed, storage_path: mapPublicUrl(parsed.storage_path) };
    });
  }

  return matches.map((match) => ({
    ...match,
    submissions: parsedSubmissions.filter((submission) =>
      [match.submission_a, match.submission_b].includes(submission.id)
    ),
    artifacts: artifactRecords.filter((artifact) =>
      [match.submission_a, match.submission_b].includes(artifact.submission_id)
    )
  }));
}
);

export const getLeaderboard = cache(async (): Promise<Rating[]> => {
  const client = supabaseServer();
  const { data, error } = await client.rpc("ratings_with_sparkline");
  if (error) throw error;

  return (data ?? []).map((item: any) =>
    RatingSchema.parse({
      model_id: item.model_id,
      rating: item.rating,
      model_label: item.model_label,
      provider_name: item.provider_name,
      sparkline: item.sparkline ?? []
    })
  );
});
