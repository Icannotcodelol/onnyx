import { TaskSpec } from "@autobench/shared";

export const SYSTEM_PROMPT = `You are participating in AutoBench, a daily automated benchmark for generative models. Output only executable code implementing the required harness signature. No external URLs, no comments, no explanations.`;

export function buildModelPrompt(task: TaskSpec): string {
  const lines = [
    `Task: ${task.title}`,
    "",
    task.summary,
    "",
    "Instructions:",
    task.instructions,
    "",
    "Acceptance criteria:",
    ...task.acceptanceCriteria.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Starter code:",
    "```",
    task.starter.code.trim(),
    "```"
  ];

  return lines.join("\n");
}

export function formatSubmissionPrompt(task: TaskSpec): string {
  const modelPrompt = buildModelPrompt(task);
  return `System: ${SYSTEM_PROMPT}\n\n${modelPrompt}`;
}
