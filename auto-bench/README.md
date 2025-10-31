# AutoBench

AutoBench is a daily LLM code benchmarking platform. It orchestrates daily task generation, multi-provider dispatch, sandboxed execution, artifact capture, and a public-facing Next.js website for voting and leaderboards. This repository contains a pnpm + Turborepo monorepo with services, shared packages, Supabase migrations/functions, and documentation.

## Apps & services

- **apps/web** – Next.js front end for browsing tasks, voting in the arena, and reviewing leaderboards.
- **services/dispatcher** – Generates daily tasks, collects completions from providers, and coordinates submission storage.
- **services/renderer** – Executes untrusted code in Playwright to capture deterministic artifacts.
- **supabase/functions** – Edge functions for vote submission, artifact upload orchestration, webhook ingestion, and daily scheduling triggers.
- **packages/shared** – Shared Zod schemas, utilities, and validation helpers.

## Getting started

1. Install dependencies: `pnpm install`.
2. Install Playwright browsers: `npx playwright install --with-deps`.
3. Copy `.env.example` to `.env` and `.env.local`, then populate with secrets.
4. Run Supabase migrations (see `supabase/migrations`).
5. Deploy Edge Functions from `supabase/functions/*` (see below) and configure Supabase Storage bucket `artifacts` as public.
6. Start development servers:
   - `pnpm dev --filter web` for the Next.js app (http://localhost:3000).
   - `pnpm dev --filter renderer` for the Playwright renderer (http://localhost:4000).
   - `pnpm dev --filter dispatcher` for scheduled pipelines (http://localhost:4100).
7. Seed initial data with `pnpm seed`.

## Automation & Edge Functions

Supabase Edge Functions coordinate the daily pipeline. Deploy each folder in `supabase/functions` with `supabase functions deploy <name>` and set the following secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `DISPATCHER_URL`

Schedule the cron triggers (UTC):

- `generate_daily_tasks` at 09:00
- `dispatch_and_collect` at 09:05
- `pair_generator` every 10 minutes

Expose `submit_vote` without auth so the Next.js site can call it.

## MCP (Model Context Protocol)

Build the bundled Supabase MCP bridge with `pnpm --filter mcp-supabase build`. Then register it in `~/.codex/config.toml`:

```
[mcp.servers.supabase_local]
command = "node"
args = ["tools/mcp-supabase/dist/server.js"]
env = { SUPABASE_URL = "<your supabase url>", SUPABASE_SERVICE_ROLE_KEY = "<service role key>" }
```

The bridge exposes three tools: `sql_query`, `storage_upload`, and `rpc`.

Refer to detailed docs inside each package for configuration and runtime details.
