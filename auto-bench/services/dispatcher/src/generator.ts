import { randomUUID } from "crypto";
import { TaskSpec, TaskSpecSchema } from "@autobench/shared";
import { z } from "zod";
import fetch from "node-fetch";

const generatorResponseSchema = z.object({
  tasks: z.array(TaskSpecSchema.omit({ id: true })).length(3)
});

const fallbackTasks: TaskSpec[] = [
  {
    id: randomUUID(),
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
      code: `export function render(canvas: HTMLCanvasElement, audioPCMFloat32: Float32Array) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No context');
  ctx.fillStyle = '#020512';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}`
    }
  },
  {
    id: randomUUID(),
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
      code: `export function render(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b102b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}`
    }
  },
  {
    id: randomUUID(),
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
      code: `export function render(container: HTMLElement) {
  container.innerHTML = '<div style="color:white">Grid placeholder</div>';
}`
    }
  }
];

export async function generateTaskSpecs(): Promise<TaskSpec[]> {
  const generatorUrl = process.env.DISPATCHER_GENERATOR_URL;
  const modelKey = process.env.OPENAI_API_KEY;

  if (!generatorUrl || !modelKey) {
    return fallbackTasks.map((task) => ({ ...task, id: randomUUID() }));
  }

  const response = await fetch(generatorUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${modelKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      prompt:
        "Generate 3 JSON task specs with slug,title,summary,runtime,instructions,acceptanceCriteria[3],starter{language,code}. Return JSON only.",
      count: 3
    })
  });

  if (!response.ok) {
    console.warn("Generator endpoint failed, using fallback tasks");
    return fallbackTasks.map((task) => ({ ...task, id: randomUUID() }));
  }

  const json = await response.json();
  const parsed = generatorResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.warn("Generator parse error", parsed.error);
    return fallbackTasks.map((task) => ({ ...task, id: randomUUID() }));
  }

  return parsed.data.tasks.map((task) => ({ ...task, id: randomUUID() }));
}
