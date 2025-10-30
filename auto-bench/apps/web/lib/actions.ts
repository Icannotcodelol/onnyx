"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "./supabaseClient";
import { VotePayloadSchema } from "@/shared/index";

export async function castVote(input: { matchId: string; winnerSubmissionId: string; loserSubmissionId: string }) {
  const payload = VotePayloadSchema.parse(input);
  const supabase = supabaseServer();

  const { data, error: voteError } = await supabase.functions.invoke("submit_vote", {
    body: JSON.stringify({
      matchId: payload.matchId,
      winnerSubmissionId: payload.winnerSubmissionId,
      loserSubmissionId: payload.loserSubmissionId
    })
  });

  if (voteError) {
    throw new Error(voteError.message);
  }

  if (data && (data as any).error) {
    throw new Error((data as any).error);
  }

  revalidatePath("/arena");
  revalidatePath("/leaderboard");
}
