import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

export async function requireCronSecret(request: Request) {
  const headerSecret = request.headers.get("x-cron-secret");
  const expected = Deno.env.get("CRON_SECRET");
  if (expected && headerSecret !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  return null;
}
