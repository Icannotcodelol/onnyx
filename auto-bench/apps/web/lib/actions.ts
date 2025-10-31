"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "./supabaseClient";
import { VotePayloadSchema } from "@autobench/shared";

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

export async function triggerTaskGeneration() {
  const dispatcherUrl = process.env.DISPATCHER_URL ?? process.env.NEXT_PUBLIC_DISPATCHER_URL;
  if (!dispatcherUrl) {
    throw new Error("Dispatcher URL is not configured.");
  }

  const response = await fetch(`${dispatcherUrl}/api/generate`, { method: "POST" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to trigger task generation.");
  }

  revalidatePath("/");
  revalidatePath("/arena");
  revalidatePath("/leaderboard");
}
