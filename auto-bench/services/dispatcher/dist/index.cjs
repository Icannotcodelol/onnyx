"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_fastify = __toESM(require("fastify"), 1);
var import_dotenv = require("dotenv");
var import_node_fs = require("fs");
var import_node_path = require("path");
var import_node_url = require("url");
var import_supabase_js2 = require("@supabase/supabase-js");

// src/generator.ts
var import_crypto = require("crypto");
var import_shared = require("@autobench/shared");
var import_zod = require("zod");
var import_node_fetch = __toESM(require("node-fetch"), 1);
var generatorResponseSchema = import_zod.z.object({
  tasks: import_zod.z.array(import_shared.TaskSpecSchema.omit({ id: true })).length(3)
});
var fallbackTasks = [
  {
    id: (0, import_crypto.randomUUID)(),
    slug: "audio-visualization-sphere",
    title: "Audio Visualization Sphere",
    summary: "Render a responsive 3D-inspired audio visualization using Canvas 2D.",
    runtime: "js-browser",
    instructions: "Implement render(canvas, audioPCMFloat32) to animate orbiting particles based on amplitude. Initialize under 1s and maintain 30 FPS.",
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
    id: (0, import_crypto.randomUUID)(),
    slug: "sort-visualizer",
    title: "Sort Explorer",
    summary: "Animate an in-browser sorting visualizer with color-coded bars and controls.",
    runtime: "js-browser",
    instructions: "Render 64 bars. Animate bubble sort with gradient colors and highlight comparisons. Provide play/pause controls via keyboard.",
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
    id: (0, import_crypto.randomUUID)(),
    slug: "responsive-grid",
    title: "Responsive Grid Sketch",
    summary: "Generate an adaptive CSS grid layout with animated cards and keyboard focus.",
    runtime: "js-browser",
    instructions: "Implement render(container) to create a responsive grid with 12 cards, animated hover states, and keyboard navigation cues.",
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
async function generateTaskSpecs() {
  const generatorUrl = process.env.DISPATCHER_GENERATOR_URL;
  const modelKey = process.env.OPENAI_API_KEY;
  if (!generatorUrl || !modelKey) {
    return fallbackTasks.map((task) => ({ ...task, id: (0, import_crypto.randomUUID)() }));
  }
  const response = await (0, import_node_fetch.default)(generatorUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${modelKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      prompt: "Generate 3 JSON task specs with slug,title,summary,runtime,instructions,acceptanceCriteria[3],starter{language,code}. Return JSON only.",
      count: 3
    })
  });
  if (!response.ok) {
    console.warn("Generator endpoint failed, using fallback tasks");
    return fallbackTasks.map((task) => ({ ...task, id: (0, import_crypto.randomUUID)() }));
  }
  const json = await response.json();
  const parsed = generatorResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.warn("Generator parse error", parsed.error);
    return fallbackTasks.map((task) => ({ ...task, id: (0, import_crypto.randomUUID)() }));
  }
  return parsed.data.tasks.map((task) => ({ ...task, id: (0, import_crypto.randomUUID)() }));
}

// src/runTask.ts
var import_crypto2 = require("crypto");
var import_supabase_js = require("@supabase/supabase-js");
var import_node_fetch6 = __toESM(require("node-fetch"), 1);
var shared = __toESM(require("@autobench/shared"), 1);

// src/providers/openai.ts
var import_node_fetch2 = __toESM(require("node-fetch"), 1);

// src/harness.ts
var SYSTEM_PROMPT = `You are participating in AutoBench, a daily automated benchmark for generative models.

Your task is to write COMPLETE, FULLY-IMPLEMENTED, high-quality JavaScript code that will run in a browser canvas environment.

CRITICAL REQUIREMENTS:
- Implement a function called "render(canvas, audioData)" that takes an HTMLCanvasElement and Float32Array
- The canvas is 1280x720 pixels
- Create visually impressive, smooth, COMPLEX animations that demonstrate your capabilities
- Use requestAnimationFrame for continuous animation
- Make it HIGHLY interactive and responsive to the audioData parameter (use amplitude to drive visual effects)
- Write COMPLETE implementations - no placeholders, no TODOs, no incomplete features
- Aim for 100-200 lines of well-structured code
- Include proper initialization, animation loops, and visual effects
- NO external libraries, NO fetch calls, NO external URLs
- Return ONLY the code, no markdown formatting, no explanations, no comments about what you're doing

QUALITY STANDARDS:
- This is a COMPETITION - make your implementation stand out
- Use advanced canvas techniques (gradients, transforms, compositing)
- Create smooth, performant animations at 60 FPS
- Implement the FULL task specification - don't cut corners
- Show off your coding capabilities with elegant, efficient solutions

EXAMPLE STRUCTURE (expand this significantly):
function render(canvas, audioData) {
  const ctx = canvas.getContext('2d');
  
  // Initialize your scene (particles, objects, state, etc.)
  const particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({ /* full particle state */ });
  }
  
  function animate() {
    // Clear canvas
    // Update all objects based on audioData
    // Draw everything
    // Apply effects
    requestAnimationFrame(animate);
  }
  animate();
}`;
function buildModelPrompt(task) {
  const lines = [
    `Task: ${task.title}`,
    "",
    task.summary,
    "",
    "Instructions:",
    task.instructions,
    "",
    "Acceptance criteria:",
    ...task.acceptanceCriteria.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Starter code:",
    "```",
    task.starter.code.trim(),
    "```"
  ];
  return lines.join("\n");
}
function formatSubmissionPrompt(task) {
  const modelPrompt = buildModelPrompt(task);
  return `System: ${SYSTEM_PROMPT}

${modelPrompt}`;
}

// src/providers/openai.ts
var OPENAI_URL = "https://api.openai.com/v1/chat/completions";
var fallbackCode = `export function render(canvas, input) {
  const ctx = canvas.getContext('2d');
  let t = 0;
  function frame() {
    t += 0.02;
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = 'rgba(12,18,64,0.9)';
    ctx.fillRect(0,0,w,h);
    for (let i=0;i<100;i++) {
      const x = (Math.sin(t + i)*0.5+0.5)*w;
      const y = (Math.cos(t*0.8 + i)*0.5+0.5)*h;
      const size = 4 + Math.sin(t+i)*3;
      ctx.fillStyle = \`rgba(60,79,255,0.6)\`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  frame();
}`;
function createOpenAIProvider(apiKey) {
  return {
    id: "openai",
    label: "OpenAI",
    async call(spec, systemPrompt) {
      if (!apiKey) {
        return { code: fallbackCode };
      }
      const response = await (0, import_node_fetch2.default)(OPENAI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.8,
          top_p: 0.95,
          max_tokens: 4e3,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: buildModelPrompt(spec)
            }
          ]
        })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenAI error: ${text}`);
      }
      const json = await response.json();
      const message = json.choices?.[0]?.message?.content;
      if (!message) {
        throw new Error("OpenAI returned no content");
      }
      return { code: message.trim(), tokens: json.usage?.total_tokens };
    }
  };
}

// src/providers/anthropic.ts
var import_node_fetch3 = __toESM(require("node-fetch"), 1);
var ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
var fallbackCode2 = `export function render(canvas) {
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#3c4fff');
  gradient.addColorStop(1, '#0e165f');
  let t = 0;
  function loop() {
    t += 0.015;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2 + t;
      const radius = 80 + Math.sin(t * 3 + i) * 20;
      const x = canvas.width / 2 + Math.cos(angle) * radius;
      const y = canvas.height / 2 + Math.sin(angle) * radius;
      ctx.fillStyle = \`rgba(197,207,255,0.6)\`;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  loop();
}`;
function createAnthropicProvider(apiKey) {
  return {
    id: "anthropic",
    label: "Anthropic",
    async call(spec, systemPrompt) {
      if (!apiKey) {
        return { code: fallbackCode2 };
      }
      const response = await (0, import_node_fetch3.default)(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-latest",
          max_tokens: 2500,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: buildModelPrompt(spec)
            }
          ]
        })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Anthropic error: ${text}`);
      }
      const json = await response.json();
      const message = json.content?.[0]?.text;
      if (!message) {
        throw new Error("Anthropic returned no content");
      }
      return { code: message.trim(), tokens: json.usage?.output_tokens };
    }
  };
}

// src/providers/google.ts
var import_node_fetch4 = __toESM(require("node-fetch"), 1);
var fallbackCode3 = `export function render(canvas) {
  const ctx = canvas.getContext('2d');
  let t = 0;
  function frame() {
    t += 0.016;
    ctx.fillStyle = '#050a24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 120; i++) {
      const angle = (i / 120) * Math.PI * 2 + t;
      const radius = 120 + Math.sin(t * 4 + i) * 40;
      const x = canvas.width / 2 + Math.cos(angle) * radius;
      const y = canvas.height / 2 + Math.sin(angle) * radius;
      ctx.fillStyle = \`rgba(108,125,255,0.5)\`;
      ctx.fillRect(x, y, 4, 4);
    }
    requestAnimationFrame(frame);
  }
  frame();
}`;
function createGoogleProvider(apiKey) {
  return {
    id: "google",
    label: "Google",
    async call(spec, systemPrompt) {
      if (!apiKey) {
        return { code: fallbackCode3 };
      }
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
      const response = await (0, import_node_fetch4.default)(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}

${buildModelPrompt(spec)}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 4e3
          }
        })
      });
      if (!response.ok) {
        const text2 = await response.text();
        throw new Error(`Google error: ${text2}`);
      }
      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Google returned no content");
      }
      return { code: text.trim() };
    }
  };
}

// src/providers/deepseek.ts
var import_node_fetch5 = __toESM(require("node-fetch"), 1);
var fallbackCode4 = `export function render(canvas) {
  const ctx = canvas.getContext('2d');
  const dots = new Array(80).fill(0).map((_, i) => ({
    angle: (i / 80) * Math.PI * 2,
    radius: 50 + i,
    speed: 0.005 + (i % 5) * 0.001
  }));
  function frame(time) {
    ctx.fillStyle = '#050a24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    dots.forEach((dot, i) => {
      const r = dot.radius + Math.sin(time * dot.speed) * 12;
      const x = canvas.width / 2 + Math.cos(dot.angle + time * dot.speed) * r;
      const y = canvas.height / 2 + Math.sin(dot.angle + time * dot.speed) * r;
      ctx.fillStyle = \`rgba(108,125,255,0.7)\`;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}`;
function createDeepSeekProvider(apiKey) {
  return {
    id: "deepseek",
    label: "DeepSeek",
    async call(spec, systemPrompt) {
      if (!apiKey) {
        return { code: fallbackCode4 };
      }
      const response = await (0, import_node_fetch5.default)("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-coder",
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 1200,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Task: ${spec.title}
Description: ${spec.summary}
Acceptance: ${spec.acceptanceCriteria.join("; ")}
Limits: maxLines=250, initMs=1000, runMs=15000
Return only code.`
            }
          ]
        })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`DeepSeek error: ${text}`);
      }
      const json = await response.json();
      const message = json.choices?.[0]?.message?.content;
      if (!message) {
        throw new Error("DeepSeek returned no content");
      }
      return { code: message.trim(), tokens: json.usage?.total_tokens };
    }
  };
}

// src/providers/index.ts
function loadProviders() {
  return {
    openai: createOpenAIProvider(process.env.OPENAI_API_KEY),
    anthropic: createAnthropicProvider(process.env.ANTHROPIC_API_KEY),
    google: createGoogleProvider(process.env.GOOGLE_API_KEY),
    deepseek: createDeepSeekProvider(process.env.DEEPSEEK_API_KEY)
  };
}

// src/runTask.ts
var { sanitizeSubmissionCode, TaskSpecSchema: TaskSpecSchema2 } = shared;
async function renderArtifact(rendererUrl, runtime, code) {
  const response = await (0, import_node_fetch6.default)(`${rendererUrl}/render`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ runtime, code })
  });
  if (!response.ok) {
    throw new Error(`Renderer failed: ${await response.text()}`);
  }
  return await response.json();
}
async function uploadArtifact(supabaseUrl, supabaseKey, submissionId, render) {
  const supabase = (0, import_supabase_js.createClient)(supabaseUrl, supabaseKey);
  const buffer = Buffer.from(render.thumbnail, "base64");
  const path = `submissions/${submissionId}/${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage.from("artifacts").upload(path, buffer, {
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
async function callProvider(provider, task) {
  const response = await provider.call(task, SYSTEM_PROMPT);
  const cleanCode = sanitizeSubmissionCode(response.code);
  return { code: cleanCode, tokens: response.tokens };
}
async function runTaskForProvider(provider, task, supabaseUrl, supabaseKey, rendererUrl, modelId) {
  const supabase = (0, import_supabase_js.createClient)(supabaseUrl, supabaseKey);
  const { code, tokens } = await callProvider(provider, task);
  const submissionId = (0, import_crypto2.randomUUID)();
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
  if (submissionError)
    throw submissionError;
  try {
    const render = await renderArtifact(rendererUrl, task.runtime, code);
    await uploadArtifact(supabaseUrl, supabaseKey, submissionId, render);
  } catch (error) {
    console.error("Renderer failure", error);
    await supabase.from("submissions").update({ status: "failed", error: String(error) }).eq("id", submissionId);
  }
}
async function dispatchTask({ task, supabaseUrl, supabaseKey, rendererUrl }) {
  const supabase = (0, import_supabase_js.createClient)(supabaseUrl, supabaseKey);
  const providers = loadProviders();
  const validatedTask = TaskSpecSchema2.parse(task);
  if (!validatedTask.id) {
    throw new Error("Task is missing an id; cannot dispatch");
  }
  const { data: models, error: modelsError } = await supabase.from("models").select("id, label, provider_id, model_providers(name)").eq("is_active", true);
  if (modelsError)
    throw modelsError;
  const typedModels = models ?? [];
  for (const model of typedModels) {
    const relation = model.model_providers;
    const providerName = Array.isArray(relation) ? relation[0]?.name : relation?.name;
    const providerKey = providerName?.toLowerCase();
    const provider = providerKey ? providers[providerKey] : void 0;
    if (!provider)
      continue;
    await runTaskForProvider(provider, validatedTask, supabaseUrl, supabaseKey, rendererUrl, model.id);
  }
}

// src/index.ts
var import_crypto3 = require("crypto");
var shared2 = __toESM(require("@autobench/shared"), 1);
var import_meta = {};
var { TaskSpecSchema: TaskSpecSchema3 } = shared2;
function ensureEnvLoaded() {
  (0, import_dotenv.config)();
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }
  const moduleDir = typeof __dirname !== "undefined" ? __dirname : (0, import_node_path.dirname)((0, import_node_url.fileURLToPath)(import_meta.url));
  const candidates = [
    (0, import_node_path.resolve)(process.cwd(), ".env"),
    (0, import_node_path.resolve)(moduleDir, ".env"),
    (0, import_node_path.resolve)(moduleDir, "../.env"),
    (0, import_node_path.resolve)(moduleDir, "../../.env"),
    (0, import_node_path.resolve)(moduleDir, "../../../.env")
  ];
  for (const candidate of candidates) {
    if (!(0, import_node_fs.existsSync)(candidate))
      continue;
    (0, import_dotenv.config)({ path: candidate, override: false });
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      break;
    }
  }
}
ensureEnvLoaded();
var PORT = Number(process.env.PORT ?? 4100);
var HOST = process.env.HOST ?? "0.0.0.0";
var SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
var RENDERER_URL = process.env.RENDERER_URL ?? "http://localhost:4000";
if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is not configured");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
}
var app = (0, import_fastify.default)({ logger: true });
app.get("/health", () => ({ status: "ok" }));
app.post("/api/generate", async () => {
  const supabase = (0, import_supabase_js2.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const tasks = await generateTaskSpecs();
  const inserts = tasks.map((task) => ({
    id: task.id ?? (0, import_crypto3.randomUUID)(),
    title: task.title,
    spec: { ...task },
    status: "generated"
  }));
  const { data, error } = await supabase.from("tasks").insert(inserts).select();
  if (error) {
    throw error;
  }
  return { tasks: data };
});
app.post("/api/dispatch", async (request, reply) => {
  const supabase = (0, import_supabase_js2.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let tasks = [];
  if (request.body?.taskIds) {
    const { taskIds } = request.body;
    const { data, error } = await supabase.from("tasks").select("id, title, spec").in("id", taskIds);
    if (error)
      throw error;
    tasks = (data ?? []).map((row) => TaskSpecSchema3.parse({ ...row.spec, id: row.id }));
  } else {
    const { data, error } = await supabase.from("tasks").select("id, title, spec").eq("status", "generated");
    if (error)
      throw error;
    tasks = (data ?? []).map((row) => TaskSpecSchema3.parse({ ...row.spec, id: row.id }));
  }
  for (const task of tasks) {
    await dispatchTask({ task, supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_SERVICE_ROLE_KEY, rendererUrl: RENDERER_URL });
    await supabase.from("tasks").update({ status: "dispatched" }).eq("id", task.id);
  }
  reply.code(202);
  return { ok: true, count: tasks.length };
});
app.listen({ port: PORT, host: HOST }).then(() => {
  console.log(`Dispatcher listening on http://${HOST}:${PORT}`);
});
