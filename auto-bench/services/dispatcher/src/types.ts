import { TaskSpec } from "@autobench/shared";

export interface ProviderCallResult {
  code: string;
  tokens?: number;
}

export interface Provider {
  id: "openai" | "anthropic" | "google" | "deepseek";
  label: string;
  call: (spec: TaskSpec, systemPrompt: string) => Promise<ProviderCallResult>;
}
