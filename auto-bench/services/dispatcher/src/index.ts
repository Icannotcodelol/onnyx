import Fastify from "fastify";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { generateTaskSpecs } from "./generator";
import { dispatchTask } from "./runTask";
import { randomUUID } from "crypto";
import type { TaskSpec } from "@autobench/shared";
import * as shared from "@autobench/shared";

const { TaskSpecSchema } = shared;

function ensureEnvLoaded() {
  loadEnv();

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  const moduleDir = typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(moduleDir, ".env"),
    resolve(moduleDir, "../.env"),
    resolve(moduleDir, "../../.env"),
    resolve(moduleDir, "../../../.env")
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    loadEnv({ path: candidate, override: false });
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      break;
    }
  }
}

ensureEnvLoaded();

const PORT = Number(process.env.PORT ?? 4100);
const HOST = process.env.HOST ?? "0.0.0.0";
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RENDERER_URL = process.env.RENDERER_URL ?? "http://localhost:4000";

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is not configured");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
}

const app = Fastify({ logger: true });

app.get("/health", () => ({ status: "ok" }));

app.post("/api/generate", async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const tasks = await generateTaskSpecs();

  const inserts = tasks.map((task) => ({
    id: task.id ?? randomUUID(),
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
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let tasks: TaskSpec[] = [];
  if ((request.body as any)?.taskIds) {
    const { taskIds } = request.body as { taskIds: string[] };
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, spec")
      .in("id", taskIds);
    if (error) throw error;
    tasks = (data ?? []).map((row) => TaskSpecSchema.parse({ ...row.spec, id: row.id }));
  } else {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, spec")
      .eq("status", "generated");
    if (error) throw error;
    tasks = (data ?? []).map((row) => TaskSpecSchema.parse({ ...row.spec, id: row.id }));
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
