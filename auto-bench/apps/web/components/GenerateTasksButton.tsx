"use client";

import { useState } from "react";
import { triggerTaskGeneration } from "@/lib/actions";

type Status = "idle" | "loading" | "success" | "error";

export function GenerateTasksButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("loading");
    setMessage(null);

    try {
      await triggerTaskGeneration();
      setStatus("success");
      setMessage("Generation queued successfully.");
    } catch (error) {
      console.error("Failed to trigger task generation", error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unknown error occurred.");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Triggering…" : "Trigger Task Generation"}
      </button>
      {message ? (
        <p className={`text-xs ${status === "error" ? "text-red-400" : "text-green-400"}`}>{message}</p>
      ) : null}
    </div>
  );
}
