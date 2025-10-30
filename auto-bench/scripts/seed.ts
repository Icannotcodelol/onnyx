import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase credentials in environment");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const providerSeeds = [
  { name: "OpenAI" },
  { name: "Anthropic" },
  { name: "Google" },
  { name: "DeepSeek" }
];

const modelSeeds = [
  { label: "GPT-4.1 mini", provider: "OpenAI", api_identifier: "gpt-4.1-mini" },
  { label: "Claude 3 Haiku", provider: "Anthropic", api_identifier: "claude-3-haiku-20240307" },
  { label: "Gemini 1.5 Pro", provider: "Google", api_identifier: "gemini-1.5-pro" },
  { label: "DeepSeek Coder", provider: "DeepSeek", api_identifier: "deepseek-coder" }
];

const tasks = [
  {
    slug: "audio-visualization-sphere",
    title: "Audio Visualization Sphere",
    summary: "Render a responsive 3D-inspired audio visualization using Canvas 2D.",
    runtime: "js-browser",
    instructions:
      "Implement render(canvas, audioPCMFloat32) to animate orbiting particles based on amplitude. Initialize under 1s and maintain 30 FPS.",
    acceptanceCriteria: [
      "Animation reacts to audio amplitude",
      "Canvas clears between frames",
      "At least 50 particles with varying radii"
    ],
    starter: {
      language: "typescript",
      code: "export function render(canvas: HTMLCanvasElement, audioPCMFloat32: Float32Array) {\\n  const ctx = canvas.getContext('2d');\\n  if (!ctx) throw new Error('No context');\\n  ctx.fillStyle = '#020512';\\n  ctx.fillRect(0, 0, canvas.width, canvas.height);\\n}"
    }
  },
  {
    slug: "sort-visualizer",
    title: "Sort Explorer",
    summary: "Animate an in-browser sorting visualizer with color-coded bars and controls.",
    runtime: "js-browser",
    instructions:
      "Render 64 bars. Animate bubble sort with gradient colors and highlight comparisons. Provide play/pause controls via keyboard.",
    acceptanceCriteria: [
      "Bars animate smoothly",
      "Comparisons highlighted",
      "Supports restart with R key"
    ],
    starter: {
      language: "typescript",
      code: "export function render(canvas: HTMLCanvasElement) {\\n  const ctx = canvas.getContext('2d');\\n  ctx.fillStyle = '#0b102b';\\n  ctx.fillRect(0, 0, canvas.width, canvas.height);\\n}"
    }
  },
  {
    slug: "responsive-grid",
    title: "Responsive Grid Sketch",
    summary: "Generate an adaptive CSS grid layout with animated cards and keyboard focus.",
    runtime: "js-browser",
    instructions:
      "Implement render(container) to create a responsive grid with 12 cards, animated hover states, and keyboard navigation cues.",
    acceptanceCriteria: [
      "Grid reflows between 1-4 columns",
      "Cards animate on hover/focus",
      "Keyboard arrow keys move focus"
    ],
    starter: {
      language: "typescript",
      code: "export function render(container: HTMLElement) {\\n  container.innerHTML = '<div style=\\"color:white\\">Grid placeholder</div>';\\n}"
    }
  }
];

const placeholderPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAHHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4xLjE2Qqeg1AAAAM9JREFUeF7t2EEOACAIBEBf/5OcEXSNCjQGtrQ7yRo8sWbNmzdv3rx5c+fOHTt27Ny5c+fOnTt27Ny5c+fOnTt27Ny5c+fOnTt27Ny5c+fOnbv2Lcu81yDhr31wxRb1Xr3G2V9Y2HbprgO32TBgzx03Gm1MM8dNxptTDPHTcp7VhYMGDPHjcbLUwzx03Gm1MM8dNxptTDPHZcp7d9gUhwQ+iv0QgAAAABJRU5ErkJggg==",
  "base64"
);

async function ensureBucket() {
  const buckets = await supabase.storage.listBuckets();
  const exists = buckets.data?.some((bucket) => bucket.name === "artifacts");
  if (!exists) {
    await supabase.storage.createBucket("artifacts", { public: true });
  }
}

async function seed() {
  await ensureBucket();

  for (const provider of providerSeeds) {
    await supabase.from("model_providers").upsert(provider, { onConflict: "name" });
  }

  const { data: providers } = await supabase.from("model_providers").select("id, name");
  const providerIdMap = new Map<string, string>();
  providers?.forEach((provider) => providerIdMap.set(provider.name, provider.id));

  for (const model of modelSeeds) {
    const providerId = providerIdMap.get(model.provider);
    if (!providerId) continue;
    await supabase.from("models").upsert(
      {
        label: model.label,
        provider_id: providerId,
        api_identifier: model.api_identifier,
        params: {},
        is_active: true
      },
      { onConflict: "api_identifier" }
    );
  }

  const insertedTasks: { id: string; title: string }[] = [];
  for (const task of tasks) {
    const { data, error } = await supabase
      .from("tasks")
      .upsert(
        {
          title: task.title,
          spec: task,
          status: "seeded"
        },
        { onConflict: "title" }
      )
      .select("id, title")
      .single();
    if (error) throw error;
    insertedTasks.push(data);
  }

  const { data: models } = await supabase
    .from("models")
    .select("id, label")
    .eq("is_active", true);

  const artifactUploads: { submissionId: string; path: string }[] = [];

  for (const task of insertedTasks) {
    for (const model of models ?? []) {
      const { data: submission, error: submissionError } = await supabase
        .from("submissions")
        .upsert(
          {
            task_id: task.id,
            model_id: model.id,
            prompt: `Seed prompt for ${task.title}`,
            code: "export function render(canvas){const ctx=canvas.getContext('2d');ctx.fillStyle='#101533';ctx.fillRect(0,0,canvas.width,canvas.height);} ",
            status: "succeeded"
          },
          { onConflict: "task_id,model_id" }
        )
        .select("id")
        .single();
      if (submissionError) throw submissionError;
      const submissionId = submission?.id ?? randomUUID();

      const artifactPath = `seeds/${submissionId}.png`;
      await supabase.storage.from("artifacts").upload(artifactPath, placeholderPng, {
        upsert: true,
        contentType: "image/png"
      });
      await supabase.from("artifacts").upsert({
        submission_id: submissionId,
        kind: "image",
        storage_path: artifactPath,
        width: 256,
        height: 256
      });

      artifactUploads.push({ submissionId, path: artifactPath });
    }
  }

  console.log(`Seed complete: ${insertedTasks.length} tasks, ${(models ?? []).length} models, ${artifactUploads.length} artifacts.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
