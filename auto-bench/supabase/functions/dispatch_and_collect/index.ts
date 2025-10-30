import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { getServiceClient, requireCronSecret } from "../_shared/client.ts";

const DISPATCHER_URL = Deno.env.get("DISPATCHER_URL") ?? "http://localhost:4100";

serve(async (req) => {
  const unauthorized = await requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const supabase = getServiceClient();
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id")
    .eq("status", "generated");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const taskIds = (tasks ?? []).map((task) => task.id);
  const response = await fetch(`${DISPATCHER_URL}/api/dispatch`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ taskIds })
  });

  if (!response.ok) {
    const body = await response.text();
    return new Response(JSON.stringify({ error: body }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, dispatched: taskIds.length }), {
    headers: { "content-type": "application/json" }
  });
});
