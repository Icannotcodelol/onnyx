import fetch from "node-fetch";
import { Provider } from "../types";
import { TaskSpec } from "@autobench/shared";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const fallbackCode = `export function render(canvas) {
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#3c4fff');
  gradient.addColorStop(1, '#0e165f');
  let t = 0;
  function loop() {
    t += 0.015;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2 + t;
      const radius = 80 + Math.sin(t * 3 + i) * 20;
      const x = canvas.width / 2 + Math.cos(angle) * radius;
      const y = canvas.height / 2 + Math.sin(angle) * radius;
      ctx.fillStyle = ` + "`" + `rgba(197,207,255,0.6)` + "`" + `;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  loop();
}`;

export function createAnthropicProvider(apiKey?: string): Provider {
  return {
    id: "anthropic",
    label: "Anthropic",
    async call(spec: TaskSpec, systemPrompt: string) {
      if (!apiKey) {
        return { code: fallbackCode };
      }

      const response = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1200,
          temperature: 0.2,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Task: ${spec.title}\nDescription: ${spec.summary}\nAcceptance: ${spec.acceptanceCriteria.join("; ")}\nLimits: maxLines=250, initMs=1000, runMs=15000\nReturn only code.`
            }
          ]
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Anthropic error: ${text}`);
      }

      const json: any = await response.json();
      const message = json.content?.[0]?.text;
      if (!message) {
        throw new Error("Anthropic returned no content");
      }
      return { code: message.trim(), tokens: json.usage?.output_tokens };
    }
  };
}
