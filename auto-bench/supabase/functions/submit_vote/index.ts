import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { z } from "https://esm.sh/zod@3";
import { getServiceClient } from "../_shared/client.ts";

const VoteSchema = z.object({
  matchId: z.string().uuid(),
  winnerSubmissionId: z.string().uuid(),
  loserSubmissionId: z.string().uuid(),
  voterKey: z.string().optional()
});

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const json = await req.json();
  const parsed = VoteSchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), { status: 400 });
  }

  const supabase = getServiceClient();
  const voterKey = parsed.data.voterKey ?? crypto.randomUUID();
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const ipHash = await sha256(`${ip}:${voterKey}`);

  const { error } = await supabase.from("votes").insert({
    match_id: parsed.data.matchId,
    winner_submission: parsed.data.winnerSubmissionId,
    loser_submission: parsed.data.loserSubmissionId,
    voter_key: voterKey,
    ip_hash: ipHash
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  const { error: eloError } = await supabase.rpc("apply_vote_elo", {
    p_match: parsed.data.matchId,
    p_winner: parsed.data.winnerSubmissionId,
    p_loser: parsed.data.loserSubmissionId
  });

  if (eloError) {
    return new Response(JSON.stringify({ error: eloError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" }
  });
});
