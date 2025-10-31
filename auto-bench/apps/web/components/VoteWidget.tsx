"use client";

import { useTransition } from "react";
import { ArrowBigLeft, ArrowBigRight, Sparkles } from "lucide-react";
import { castVote } from "@/lib/actions";

interface VoteWidgetProps {
  matchId: string;
  leftSubmissionId: string;
  rightSubmissionId: string;
}

export function VoteWidget({ matchId, leftSubmissionId, rightSubmissionId }: VoteWidgetProps) {
  const [isPending, startTransition] = useTransition();

  const handleVote = (winner: string, loser: string) => {
    startTransition(async () => {
      await castVote({ matchId, winnerSubmissionId: winner, loserSubmissionId: loser });
    });
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-xl">
      <Sparkles className="text-brand-300" />
      <p className="text-center text-sm text-slate-300">Pick the better submission to update the Elo leaderboard.</p>
      <div className="flex w-full gap-3">
        <button
          className="flex-1 rounded-xl border border-brand-500/60 bg-brand-500/20 px-4 py-3 font-semibold text-brand-100 hover:bg-brand-500/30"
          disabled={isPending}
          onClick={() => handleVote(leftSubmissionId, rightSubmissionId)}
        >
          <ArrowBigLeft className="mr-2 inline" /> Left is better
        </button>
        <button
          className="flex-1 rounded-xl border border-brand-500/60 bg-brand-500/20 px-4 py-3 font-semibold text-brand-100 hover:bg-brand-500/30"
          disabled={isPending}
          onClick={() => handleVote(rightSubmissionId, leftSubmissionId)}
        >
          Right is better <ArrowBigRight className="ml-2 inline" />
        </button>
      </div>
      {isPending && <p className="text-xs text-brand-200">Submitting vote...</p>}
    </div>
  );
}
