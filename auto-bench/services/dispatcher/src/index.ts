import Fastify from "fastify";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { generateTaskSpecs } from "./generator";
import { dispatchTask } from "./runTask";
import { randomUUID } from "crypto";
import { TaskSpec, TaskSpecSchema } from "@autobench/shared";

dotenv.config();

const PORT = Number(process.env.PORT ?? 4100);
const HOST = process.env.HOST ?? "0.0.0.0";
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RENDERER_URL = process.env.RENDERER_URL ?? "http://localhost:4000";

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
