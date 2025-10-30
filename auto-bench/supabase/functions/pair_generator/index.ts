import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { getServiceClient, requireCronSecret } from "../_shared/client.ts";

serve(async (req) => {
  const unauthorized = await requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const supabase = getServiceClient();

  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("id, task_id")
    .eq("status", "succeeded");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const { data: existingMatches } = await supabase
    .from("matches")
    .select("submission_a, submission_b, task_id");

  const existingSet = new Set<string>();
  for (const match of existingMatches ?? []) {
    if (match.submission_a && match.submission_b) {
      const key = [match.task_id, match.submission_a, match.submission_b].sort().join(":");
      existingSet.add(key);
    }
  }

  const grouped = new Map<string, string[]>();
  for (const submission of submissions ?? []) {
    if (!grouped.has(submission.task_id)) {
      grouped.set(submission.task_id, []);
    }
    grouped.get(submission.task_id)?.push(submission.id);
  }

  const inserts: { task_id: string; submission_a: string; submission_b: string }[] = [];
  for (const [taskId, ids] of grouped.entries()) {
    ids.sort();
    for (let i = 0; i < ids.length - 1; i += 2) {
      const a = ids[i];
      const b = ids[i + 1];
      const key = [taskId, a, b].sort().join(":");
      if (existingSet.has(key)) continue;
      inserts.push({ task_id: taskId, submission_a: a, submission_b: b });
    }
  }

  if (inserts.length === 0) {
    return new Response(JSON.stringify({ ok: true, created: 0 }), {
      headers: { "content-type": "application/json" }
    });
  }

  const { error: insertError } = await supabase.from("matches").insert(inserts);
  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, created: inserts.length }), {
    headers: { "content-type": "application/json" }
  });
});
