import { Provider } from "../types";
import { createOpenAIProvider } from "./openai";
import { createAnthropicProvider } from "./anthropic";
import { createGoogleProvider } from "./google";
import { createDeepSeekProvider } from "./deepseek";

export function loadProviders(): Record<string, Provider> {
  return {
    openai: createOpenAIProvider(process.env.OPENAI_API_KEY),
    anthropic: createAnthropicProvider(process.env.ANTHROPIC_API_KEY),
    google: createGoogleProvider(process.env.GOOGLE_API_KEY),
    deepseek: createDeepSeekProvider(process.env.DEEPSEEK_API_KEY)
  };
}
