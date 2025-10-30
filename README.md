Below is a single-file, Codex‑ready README/master spec you can paste into GPT‑5 Codex. It tells Codex exactly what to build, how to structure the repo, which files to generate (with several critical files included inline), how to wire Supabase (DB, Storage, Edge Functions, cron), how to execute model code safely, and how to integrate Model Context Protocol (MCP) for Supabase. You’ll provide the API keys via env vars.

How to use: Paste this entire document into Codex and say:
“Build this project end‑to‑end exactly as specified. Ask for my env values when you need them.”

⸻

AutoBench — Daily LLM Code Benchmark (Next.js + Supabase + MCP)

Goal: A fully automated website that every day generates small browser‑runnable coding tasks, sends the same task to multiple model providers (OpenAI, Anthropic, Google, DeepSeek), executes their code safely, renders artifacts (thumb/MP4), and lets users A/B vote. Votes update an Elo leaderboard stored in Supabase.

You (Codex) will:
	1.	scaffold the monorepo,
	2.	set up Supabase (migrations, RLS, Elo RPC, Storage),
	3.	implement a client sandbox (iframe/CSP) and a server renderer (Playwright),
	4.	implement dispatchers for each provider,
	5.	wire A/B voting → Elo,
	6.	add MCP so the agent (you) can manage Supabase during build and future maintenance,
	7.	ship a polished UI and README.

Assumptions:
– Browser access is ON for Codex.
– The user will supply env vars (API keys).
– Use Supabase for DB/Storage and scheduled Edge Functions for daily tasks. Supabase supports cron/scheduling and Storage uploads from functions.  ￼
– Use Playwright for headless rendering of artifacts.  ￼
– For client‑side execution, prefer WebContainers (Node in browser) + sandboxed iframes; Python via Pyodide when needed.  ￼
– Use Content‑Security‑Policy (CSP) and iframe sandbox for isolation.  ￼
– Use MCP to connect Codex to Supabase; Codex reads MCP config from ~/.codex/config.toml.  ￼

⸻

0) Deliverables / Acceptance criteria
	•	Visiting / shows today’s tasks.
	•	Each task displays side‑by‑side submissions (artifact + “View code”).
	•	/arena presents A/B matches; submitting a vote updates Elo instantly.
	•	/leaderboard ranks models by Elo; a small sparkline shows recent changes.
	•	A daily pipeline (cron) creates 3 new tasks, dispatches to all active models, executes code (client sandbox or server render), stores artifacts, and publishes.
	•	Strict safety: untrusted code runs with no network, hard time limits, and memory caps; on server, run inside a headless page with outbound requests blocked.
	•	Reproducibility: we store prompt, params, model ID, and code for each submission.
	•	MCP: a minimal Supabase MCP server is included in the repo and registered in .codex/config.toml so you (Codex) can query/manage Supabase as needed via MCP.  ￼

⸻

1) Tech & architecture
	•	Monorepo with pnpm workspaces & Turborepo.
	•	apps/web — Next.js (App Router, TS), Tailwind, shadcn/ui.
	•	services/dispatcher — Node/TS: prompt gen + multi‑provider dispatch.
	•	services/renderer — Node/TS + Playwright: server‑render artifacts (PNG + optional MP4).  ￼
	•	packages/shared — Zod schemas & types.
	•	Supabase — Postgres + Storage + Edge Functions + cron scheduling.  ￼
	•	Execution
	•	Client path (preferred): iframe + CSP, optionally WebContainers for Node tasks, Pyodide for Python tasks.  ￼
	•	Server path (fallback): Headless render in Playwright, block network requests and cap wall‑time.  ￼
	•	Voting & Ranking: A/B votes → Elo (K=32).  ￼

⸻

2) Environment variables (user will supply)

Create .env for services and .env.local for Next.js. Do not print secrets in logs.

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
DEEPSEEK_API_KEY=

# Internal
CRON_SECRET=replace-me
BASE_URL=http://localhost:3000
RENDERER_URL=http://localhost:4000

# MCP (if needed by local server transport)
MCP_SUPABASE_URL=${SUPABASE_URL}
MCP_SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY}


⸻

3) Repository layout (generate exactly)

/auto-bench
  package.json
  pnpm-workspace.yaml
  turbo.json
  README.md
  .env.example
  docker-compose.yml

  /apps/web
    next.config.ts
    tailwind.config.ts
    postcss.config.js
    tsconfig.json
    app/(site)/layout.tsx
    app/(site)/page.tsx
    app/arena/page.tsx
    app/leaderboard/page.tsx
    app/task/[id]/page.tsx
    components/{Header,Footer,ArtifactViewer,CodeViewer,VoteWidget}.tsx
    lib/{supabaseClient.ts,fetchers.ts,ui.ts}
    styles/globals.css
    public/logo.svg

  /services/dispatcher
    src/index.ts
    src/generator.ts
    src/providers/{openai.ts,anthropic.ts,google.ts,deepseek.ts}
    src/harness.ts
    src/runTask.ts
    tsconfig.json

  /services/renderer
    src/index.ts
    src/buildHarness.ts
    tsconfig.json

  /packages/shared
    src/{types.ts,schemas.ts}
    tsconfig.json

  /tools/mcp-supabase
    src/server.ts
    tsconfig.json
    package.json

  /supabase
    config.toml
    /migrations/{001_init.sql,002_rls.sql,003_functions.sql}
    /functions/{generate_daily_tasks,dispatch_and_collect,pair_generator,submit_vote}/index.ts


⸻

4) Data model (create these SQL migrations exactly)

supabase/migrations/001_init.sql

-- Providers and models
create table public.model_providers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table public.models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.model_providers(id) on delete cascade,
  label text not null,
  api_identifier text not null,
  params jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  spec jsonb not null,
  status text not null default 'pending'
);
create index on public.tasks(created_at desc);

-- Submissions (one per model per task)
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  model_id uuid references public.models(id) on delete cascade,
  prompt text not null,
  code text,
  status text not null default 'queued',
  error text,
  metrics jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (task_id, model_id)
);

-- Artifacts (thumb/gif/mp4/png/log)
create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade,
  kind text not null,
  storage_path text not null,
  width int, height int, duration_ms int
);

-- Matches for A/B votes
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  submission_a uuid references public.submissions(id) on delete set null,
  submission_b uuid references public.submissions(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Votes (anonymous; 1 per voter_key per match)
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  winner_submission uuid references public.submissions(id) on delete set null,
  loser_submission uuid references public.submissions(id) on delete set null,
  voter_key text not null,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  constraint unique_vote_once unique (match_id, voter_key)
);

-- Elo ratings
create table public.ratings (
  model_id uuid primary key references public.models(id) on delete cascade,
  rating int not null default 1500
);

create table public.rating_history (
  id bigserial primary key,
  model_id uuid references public.models(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  delta int not null,
  rating_after int not null,
  created_at timestamptz not null default now()
);

supabase/migrations/002_rls.sql

alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.artifacts enable row level security;
alter table public.matches enable row level security;
alter table public.votes enable row level security;
alter table public.ratings enable row level security;
alter table public.rating_history enable row level security;

-- Public read for site
create policy "public_read_tasks"        on public.tasks         for select using (true);
create policy "public_read_submissions"  on public.submissions   for select using (true);
create policy "public_read_artifacts"    on public.artifacts     for select using (true);
create policy "public_read_matches"      on public.matches       for select using (true);
create policy "public_read_ratings"      on public.ratings       for select using (true);
create policy "public_read_rating_hist"  on public.rating_history for select using (true);

-- Votes: allow insert (duplicate prevention via unique constraint)
create policy "public_insert_votes"      on public.votes for insert with check (true);
create policy "no_read_votes"            on public.votes for select using (false);

supabase/migrations/003_functions.sql

-- Elo helpers (standard logistic curve) 
-- E_A = 1 / (1 + 10^((Rb - Ra)/400))  [Wikipedia] 
create or replace function public.elo_expected(a int, b int)
returns numeric language sql immutable as $$
  select 1.0 / (1.0 + power(10.0, ((b - a)::numeric / 400.0)));
$$;

create or replace function public.apply_vote_elo(
  p_winner uuid,
  p_loser uuid,
  p_match uuid,
  p_k int default 32
) returns void language plpgsql security definer as $$
declare
  w_model uuid; l_model uuid; w_old int; l_old int;
  exp_w numeric; exp_l numeric;
  w_new int; l_new int;
begin
  select s.model_id into w_model from public.submissions s where s.id = p_winner;
  select s.model_id into l_model from public.submissions s where s.id = p_loser;

  select rating into w_old from public.ratings where model_id = w_model for update;
  select rating into l_old from public.ratings where model_id = l_model for update;

  if w_old is null then insert into public.ratings(model_id,rating) values (w_model,1500) on conflict do nothing; w_old := 1500; end if;
  if l_old is null then insert into public.ratings(model_id,rating) values (l_model,1500) on conflict do nothing; l_old := 1500; end if;

  exp_w := public.elo_expected(w_old, l_old);
  exp_l := public.elo_expected(l_old, w_old);

  w_new := round(w_old + p_k * (1 - exp_w));
  l_new := round(l_old + p_k * (0 - exp_l));

  update public.ratings set rating = w_new where model_id = w_model;
  update public.ratings set rating = l_new where model_id = l_model;

  insert into public.rating_history(model_id, match_id, delta, rating_after)
  values (w_model, p_match, (w_new - w_old), w_new),
         (l_model, p_match, (l_new - l_old), l_new);
end; $$;

Notes: Elo formula reference: Wikipedia / common implementations.  ￼

⸻

5) Shared schema (Zod) — generate and use everywhere

packages/shared/src/schemas.ts

import { z } from "zod";

export const TaskSpec = z.object({
  runtime: z.enum(["js-canvas","js-webgl","js-dom","py-pyodide"]).default("js-canvas"),
  title: z.string(),
  description: z.string(),
  harnessSignature: z.string().default("render(canvas, input)"),
  acceptance: z.array(z.string()),
  limits: z.object({
    maxLines: z.number().default(200),
    initMs: z.number().default(1000),
    runMs: z.number().default(5000),
  }),
  clientSafe: z.boolean().default(true),
});

export type TaskSpec = z.infer<typeof TaskSpec>;


⸻

6) Daily automation (Supabase Edge Functions + Cron)

Create four Edge Functions under supabase/functions:
	1.	generate_daily_tasks — uses a generator model to produce 3 task specs (strict JSON), validates with Zod, inserts into tasks.
	2.	dispatch_and_collect — for each new task, calls each active provider with identical settings; stores submissions.
	•	If clientSafe, store code for client-run.
	•	Always request server render via services/renderer to produce a thumbnail + 5s MP4 (if ffmpeg available; else PNG only). Upload results to Supabase Storage.  ￼
	3.	pair_generator — periodically create A/B matches from ready submissions of the same task.
	4.	submit_vote — accepts { matchId, winnerSubmissionId, loserSubmissionId, voterKey }, inserts into votes, then calls apply_vote_elo.

Schedule via Supabase cron:
	•	09:00 UTC generate_daily_tasks
	•	09:05 UTC dispatch_and_collect
	•	Every 10 min pair_generator
Supabase supports scheduled Edge Functions.  ￼

Important: Use the service role key inside Edge Functions to write Storage and DB where RLS blocks anonymous users.  ￼

⸻

7) Provider adapters (fairness)

Uniform system prompt & parameters across providers. Pin: temperature, top_p, seed, max_tokens, stop. Store submissions.prompt.

System prompt template (identical):

“Output only executable code implementing {harnessSignature} using {runtime}. No imports, no external URLs, no comments, no text outside code. Assume we provide a <canvas> and an input matching the signature. Must initialize in {initMs} ms and run for {runMs} ms. No network.”

User message:

Task: {title}
Description: {description}
Acceptance: {acceptance.join("; ")}
Limits: maxLines={maxLines}, initMs={initMs}, runMs={runMs}
Return only code.


⸻

8) Execution: client sandbox & server renderer

Client path (preferred)
	•	Inject code into a sandboxed iframe created from a Blob URL; set CSP to disallow connect-src and third‑party execution; limit time and memory; communicate via postMessage. Use WebContainers for Node‑style demos; use Pyodide for Python tasks.  ￼

Server path (renderer service)
	•	services/renderer exposes POST /render → { runtime, code, input }.
	•	Launch headless Chromium (Playwright), block all non-essential requests (abort XHR/fetch), set 5–6s wall‑time, take PNG screenshot, optionally encode MP4 (if ffmpeg present; otherwise skip).  ￼

⸻

9) Website (Next.js)

Pages:
	•	/ — grid of today’s tasks with model tiles (artifact + “View code”).
	•	/task/[id] — full gallery for one task; Run live only for clientSafe.
	•	/arena — A/B duel UI with keyboard shortcuts (A / L).
	•	/leaderboard — Elo table + sparkline from rating_history.

Components:
	•	ArtifactViewer (mp4→png fallback), CodeViewer (Monaco or pre/code), VoteWidget (optimistic UI).

Style: Tailwind + shadcn/ui; dark‑mode by default.

⸻

10) MCP integration (for Supabase)

You will add a tiny STDIO MCP server in this repo so Codex can call Supabase via MCP (list tables, run SQL, upload to Storage, call RPC).

Why MCP here?
	•	Codex supports MCP servers and reads configuration from ~/.codex/config.toml; MCP standardizes tool access for LLMs.  ￼
	•	Supabase documents MCP integration and also provides a hosted MCP server; we ship our own minimal server to keep transport simple (STDIO).  ￼

10.1 Generate the local MCP server (files included below)
	•	Location: /tools/mcp-supabase
	•	Transport: stdio
	•	Tools exposed:
	•	sql_query(sql: string) → rows
	•	storage_upload(bucket: string, path: string, base64: string) → { path }
	•	rpc(function: string, args: object) → any

Security reminder: use the service role key only from local dev / CI secrets, not the browser.  ￼

10.2 Register in Codex

Create/append ~/.codex/config.toml (Codex’s MCP config) with:

[mcp.servers.supabase_local]
command = "node"
args = ["tools/mcp-supabase/dist/server.js"]
env = { SUPABASE_URL = "<from .env>", SUPABASE_SERVICE_ROLE_KEY = "<from .env>" }

Codex reads MCP config from ~/.codex/config.toml.  ￼

⸻

11) Files to generate (critical ones included inline)

Codex: generate all files in the repo layout. For brevity, this README includes the most important source files verbatim. Implement the rest (pages, components, adapters, Playwright server) following the spec above.

11.1 /tools/mcp-supabase/package.json

{
  "name": "mcp-supabase",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "ts-node src/server.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "typescript": "^5.6.3"
  }
}

11.2 /tools/mcp-supabase/tsconfig.json

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}

11.3 /tools/mcp-supabase/src/server.ts (minimal STDIO MCP server)

#!/usr/bin/env node
/**
 * Minimal STDIO MCP server exposing a few Supabase tools.
 * Transport: read/write JSON lines on stdin/stdout (MCP over stdio).
 * This is intentionally simple; production servers should add auth/ACLs.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.MCP_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.MCP_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Basic MCP stdio line protocol
type Req = { id: string; tool: string; params?: any };
type Res = { id: string; ok: boolean; result?: any; error?: string };

async function handle(req: Req): Promise<Res> {
  try {
    if (req.tool === "sql_query") {
      const { sql } = req.params || {};
      const { data, error } = await supabase.rpc("exec_sql", { sql }); // optional: create RPC or use pg via http if enabled
      if (error) throw error;
      return { id: req.id, ok: true, result: data };
    }
    if (req.tool === "storage_upload") {
      const { bucket, path, base64 } = req.params || {};
      const bytes = Buffer.from(base64, "base64");
      const { error } = await supabase.storage.from(bucket).upload(path, bytes, { upsert: true, contentType: "application/octet-stream" });
      if (error) throw error;
      return { id: req.id, ok: true, result: { path } };
    }
    if (req.tool === "rpc") {
      const { function: fn, args } = req.params || {};
      // @ts-ignore
      const { data, error } = await supabase.rpc(fn, args || {});
      if (error) throw error;
      return { id: req.id, ok: true, result: data };
    }
    return { id: req.id, ok: false, error: "unknown_tool" };
  } catch (e: any) {
    return { id: req.id, ok: false, error: e?.message || String(e) };
  }
}

process.stdin.setEncoding("utf8");
let buffer = "";
process.stdin.on("data", async (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const req = JSON.parse(line) as Req;
      const res = await handle(req);
      process.stdout.write(JSON.stringify(res) + "\n");
    } catch (e) {
      process.stdout.write(JSON.stringify({ id: "unknown", ok: false, error: "bad_json" }) + "\n");
    }
  }
});

Note: This is a minimal educational server; Codex may add an SQL RPC (e.g., exec_sql) or directly use Supabase JS clients per tool. MCP background + OpenAI’s MCP concept docs:  ￼

⸻

11.4 services/renderer/src/index.ts (skeleton)

import express from "express";
import { chromium } from "playwright"; // add to package.json deps
import { buildHarnessHTML } from "./buildHarness.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

app.post("/render", async (req, res) => {
  const { runtime, code, input } = req.body || {};
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Block outbound network
  await page.route("**/*", route => {
    const type = route.request().resourceType();
    // Allow only document/styles/images/fonts for harness; block xhr/fetch
    if (["xhr","fetch","websocket"].includes(type)) return route.abort();
    return route.continue();
  });

  const html = buildHarnessHTML(runtime, code, input);
  await page.setContent(html, { waitUntil: "domcontentloaded" });

  // Run for ~5s
  await page.waitForTimeout(5000);
  const png = await page.screenshot({ type: "png" });

  // TODO: optionally encode MP4 (if ffmpeg is available).

  // In real service: upload to Supabase Storage then return paths.
  res.json({ pngBase64: Buffer.from(png).toString("base64") });

  await browser.close();
});

app.listen(4000, () => console.log("renderer up on :4000"));

Headless rendering reference (Playwright).  ￼

⸻

11.5 services/renderer/src/buildHarness.ts (skeleton)

export function buildHarnessHTML(runtime: string, code: string, input: any) {
  const inputJson = JSON.stringify(input ?? null);
  // CSP: sandbox the page heavily (inline script only, no network)
  const csp = `
    default-src 'none';
    img-src 'self' data: blob:;
    media-src 'self' data: blob:;
    style-src 'unsafe-inline';
    script-src 'unsafe-inline';
    connect-src 'none';
    font-src 'self';
  `.replace(/\n/g, " ");

  const canvas = `<canvas id="c" width="640" height="360"></canvas>`;
  const boot = `
    const userCode = ${JSON.stringify(code)};
    const inputData = ${inputJson};
    // evaluate user code in a Function scope (no imports)
    const exports = {};
    const fn = new Function('exports', userCode);
    fn(exports);
    const canvas = document.getElementById('c');
    if (exports.render) exports.render(canvas, inputData);
  `;

  return `
    <!doctype html>
    <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        <style>html,body{margin:0;padding:0;background:#000;height:100%}#c{display:block;margin:auto}</style>
      </head>
      <body>
        ${canvas}
        <script>${boot}</script>
      </body>
    </html>
  `;
}

CSP & sandboxing background.  ￼

⸻

11.6 supabase/functions/submit_vote/index.ts

import { createClient } from "@supabase/supabase-js";

export const onRequest = async (req: Request) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { matchId, winnerSubmissionId, loserSubmissionId, voterKey } = await req.json();
  const ip = req.headers.get("x-forwarded-for") ?? "0.0.0.0";
  const ua = req.headers.get("user-agent") ?? "unknown";
  const ip_hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip + ua))
    .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join(""));

  const { error: insertErr } = await supabase.from("votes").insert({
    match_id: matchId, winner_submission: winnerSubmissionId, loser_submission: loserSubmissionId, voter_key: voterKey, ip_hash
  });
  if (insertErr) return new Response(JSON.stringify({ error: insertErr.message }), { status: 400 });

  const { error: eloErr } = await supabase.rpc("apply_vote_elo", {
    p_winner: winnerSubmissionId, p_loser: loserSubmissionId, p_match: matchId
  });
  if (eloErr) return new Response(JSON.stringify({ error: eloErr.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

Storage & functions background (uploads & server keys) referenced above.  ￼

⸻

12) Task generator (daily)

services/dispatcher/src/generator.ts (Codex: implement):
	•	Call a chosen generator model to produce 3 strict‑JSON TaskSpec items.
	•	Validate via Zod; retry on invalid JSON.
	•	Insert into tasks.

Example task you should generate early:
“Audio Visualization Sphere” — runtime js-webgl, signature render(canvas, audioPCMFloat32); acceptance: init <1s, ≥30 FPS, animate normals by amplitude; no external libs.

Client‑safe → can also run live in the browser. WebGL/Canvas tasks are ideal. (WebContainers enable Node‑like experiences in the browser; Pyodide brings Python to the browser if needed.)  ￼

⸻

13) Providers (implement adapters)

Create Provider interface:

export interface Provider {
  id: "openai" | "anthropic" | "google" | "deepseek";
  call: (spec: TaskSpec, systemPrompt: string) => Promise<{ code: string; tokens?: number }>;
}

Adapters:
	•	OpenAI — Chat Completions with system prompt template above.
	•	Anthropic — Messages API equivalent.
	•	Google — Gemini generateContent.
	•	DeepSeek — Code/Chat API.

Fairness: identical temperature/top_p/seed/max_tokens; store exact prompt string and params with submission.

⸻

14) Web app basics (Codex: implement in Next.js)
	•	Supabase client (lib/supabaseClient.ts) for SSR/CSR.
	•	Data fetchers: tasks, submissions+artifacts, matches, ratings.
	•	Pages & components per spec.
	•	Voting: POST to supabase/functions/submit_vote.
	•	UI polish: shadcn/ui cards, responsive grid, keyboard shortcuts for arena.

⸻

15) Security: executing untrusted code
	•	Client: iframe with sandbox and CSP (connect-src 'none'), strict timeouts; disallow dynamic imports and <script> injection; do not expose parent window.
	•	Server: headless browser rendering with all network requests blocked; 1 core, ≤256MB, ≤6s; return only artifacts (PNG/MP4) & logs.

Background: CSP & sandbox directives, Playwright headless, WebContainers/Pyodide references.  ￼

⸻

16) Deployment
	•	Dev: pnpm i && pnpm dev (web on 3000, renderer on 4000).
	•	Supabase: run migrations; set env in Edge Functions; configure Storage bucket artifacts.
	•	Cron: configure schedules for Edge Functions (see §6).  ￼
	•	Prod: Vercel for apps/web (or Docker), Render/Fly for renderer & dispatcher. Ensure secrets are set.

⸻

17) Seed data (script)
	•	Insert 4 providers and models (labels + api_identifier).
	•	Create 3 seed tasks (Audio Sphere, Sort Visualizer, Responsive Grid).
	•	For each model, generate one submission; render artifacts; publish matches.

⸻

18) Tests (minimum)
	•	Zod spec validation (bad/missing fields rejected).
	•	Elo expected score function returns known values for (Ra,Rb) pairs.
	•	Disallow forbidden patterns (fetch, WebSocket, document.createElement('script')) in generated code.

⸻

19) Legal/ToS guardrails
	•	Use official APIs (no UI scraping).
	•	Store prompts + outputs for reproducibility; do not train a competing model with provider outputs if their ToS forbids it.
	•	Clearly label that tasks are synthetic and scored via community votes.

⸻

20) Quickstart (what Codex should do now)
	1.	Ask the user for all env vars (see §2) and write .env + .env.local.
	2.	Generate the monorepo exactly as in §3 and files in §11.
	3.	Install deps (pnpm i), add Playwright (npx playwright install --with-deps).
	4.	Initialize Supabase project connection; run migrations in /supabase/migrations.
	5.	Create Storage bucket artifacts.
	6.	Create Edge Functions (4 functions in §6), set secrets, and set schedules (cron).  ￼
	7.	Build MCP server (pnpm --filter mcp-supabase build).
	8.	Print minimal instructions for the user to add MCP to ~/.codex/config.toml (see §10.2).  ￼
	9.	Run pnpm dev; open /, /arena, /leaderboard.
	10.	Run a one‑time seeding (write a small script) so the site renders on first run.

⸻

21) Appendix — Notes & references
	•	Model Context Protocol (MCP): Open standard; Codex uses ~/.codex/config.toml for MCP servers.  ￼
	•	Supabase + MCP: Supabase docs/blog & feature page on MCP server.  ￼
	•	Cron & Functions: Scheduling Edge Functions; Storage uploads from functions; ephemeral/tmp storage options.  ￼
	•	Execution tech: WebContainers & docs; Pyodide quickstart; CSP/sandbox; Playwright headless.  ￼
	•	Elo: Formula background.  ￼

⸻

(End of master spec)

You’re set. Paste this into GPT‑5 Codex, provide your env values, and let it build the entire project from scratch—then deploy.
