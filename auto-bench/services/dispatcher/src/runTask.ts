import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import type { TaskSpec } from "@autobench/shared";
import * as shared from "@autobench/shared";
import { loadProviders } from "./providers";
import { Provider } from "./types";
import { SYSTEM_PROMPT, formatSubmissionPrompt } from "./harness";

const { sanitizeSubmissionCode, TaskSpecSchema } = shared;

interface DispatchOptions {
  task: TaskSpec;
  supabaseUrl: string;
  supabaseKey: string;
  rendererUrl: string;
}

interface RenderResponse {
  harness: string;
  thumbnail: string;
  width: number;
  height: number;
}

type ProviderRelation =
  | { name: string | null }
  | { name: string | null }[]
  | null
  | undefined;

interface ModelWithProvider {
  id: string;
  label: string;
  provider_id: string;
  model_providers?: ProviderRelation;
}

async function renderArtifact(rendererUrl: string, runtime: string, code: string) {
  const response = await fetch(`${rendererUrl}/render`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ runtime, code })
  });
  if (!response.ok) {
    throw new Error(`Renderer failed: ${await response.text()}`);
  }
  return (await response.json()) as RenderResponse;
}

async function uploadArtifact(
  supabaseUrl: string,
  supabaseKey: string,
  submissionId: string,
  render: RenderResponse
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const buffer = Buffer.from(render.thumbnail, "base64");
  const path = `submissions/${submissionId}/${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
    .from("artifacts")
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: true
    });
  if (uploadError) {
    throw uploadError;
  }

  const { error: insertError } = await supabase.from("artifacts").insert({
    submission_id: submissionId,
    kind: "image",
    storage_path: path,
    width: render.width,
    height: render.height,
    harness_html: render.harness
  });
  if (insertError) {
    throw insertError;
  }
}

async function callProvider(provider: Provider, task: TaskSpec) {
  const response = await provider.call(task, SYSTEM_PROMPT);
  const cleanCode = sanitizeSubmissionCode(response.code);
  return { code: cleanCode, tokens: response.tokens };
}

export async function runTaskForProvider(
  provider: Provider,
  task: TaskSpec,
  supabaseUrl: string,
  supabaseKey: string,
  rendererUrl: string,
  modelId: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { code, tokens } = await callProvider(provider, task);

  const submissionId = randomUUID();
  const prompt = formatSubmissionPrompt(task);
  const { error: submissionError } = await supabase.from("submissions").insert({
    id: submissionId,
    task_id: task.id,
    model_id: modelId,
    prompt,
    code,
    status: "succeeded",
    metrics: { tokens }
  });
  if (submissionError) throw submissionError;

  try {
    const render = await renderArtifact(rendererUrl, task.runtime, code);
    await uploadArtifact(supabaseUrl, supabaseKey, submissionId, render);
  } catch (error) {
    console.error("Renderer failure", error);
    await supabase
      .from("submissions")
      .update({ status: "failed", error: String(error) })
      .eq("id", submissionId);
  }
}

export async function dispatchTask({ task, supabaseUrl, supabaseKey, rendererUrl }: DispatchOptions) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const providers = loadProviders();

  const validatedTask = TaskSpecSchema.parse(task);
  if (!validatedTask.id) {
    throw new Error("Task is missing an id; cannot dispatch");
  }

  const { data: models, error: modelsError } = await supabase
    .from("models")
    .select("id, label, provider_id, model_providers(name)")
    .eq("is_active", true);
  if (modelsError) throw modelsError;

  const typedModels = (models ?? []) as ModelWithProvider[];

  for (const model of typedModels) {
    const relation = model.model_providers;
    const providerName = Array.isArray(relation) ? relation[0]?.name : relation?.name;
    const providerKey = providerName?.toLowerCase();
    const provider = providerKey ? providers[providerKey] : undefined;
    if (!provider) continue;

    await runTaskForProvider(provider, validatedTask, supabaseUrl, supabaseKey, rendererUrl, model.id);
  }
}
