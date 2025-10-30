import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { getServiceClient, requireCronSecret } from "../_shared/client.ts";

const DISPATCHER_URL = Deno.env.get("DISPATCHER_URL") ?? "http://localhost:4100";

serve(async (req) => {
  const unauthorized = await requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const response = await fetch(`${DISPATCHER_URL}/api/generate`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    }
  });

  if (!response.ok) {
    const error = await response.text();
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  const supabase = getServiceClient();
  const { data: models } = await supabase.from("models").select("id").eq("is_active", true);

  return new Response(JSON.stringify({ ok: true, models: models?.length ?? 0 }), {
    headers: { "content-type": "application/json" }
  });
});
