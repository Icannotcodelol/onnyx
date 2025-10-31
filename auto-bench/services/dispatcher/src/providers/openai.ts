import fetch from "node-fetch";
import { Provider } from "../types";
import type { TaskSpec } from "@autobench/shared";
import { buildModelPrompt } from "../harness";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const fallbackCode = `export function render(canvas, input) {
  const ctx = canvas.getContext('2d');
  let t = 0;
  function frame() {
    t += 0.02;
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = 'rgba(12,18,64,0.9)';
    ctx.fillRect(0,0,w,h);
    for (let i=0;i<100;i++) {
      const x = (Math.sin(t + i)*0.5+0.5)*w;
      const y = (Math.cos(t*0.8 + i)*0.5+0.5)*h;
      const size = 4 + Math.sin(t+i)*3;
      ctx.fillStyle = ` + "`" + `rgba(60,79,255,0.6)` + "`" + `;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  frame();
}`;

export function createOpenAIProvider(apiKey?: string): Provider {
  return {
    id: "openai",
    label: "OpenAI",
    async call(spec: TaskSpec, systemPrompt: string) {
      if (!apiKey) {
        return { code: fallbackCode };
      }

      const response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.8,
          top_p: 0.95,
          max_tokens: 4000,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: buildModelPrompt(spec)
            }
          ]
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenAI error: ${text}`);
      }

      const json: any = await response.json();
      const message = json.choices?.[0]?.message?.content;
      if (!message) {
        throw new Error("OpenAI returned no content");
      }
      return { code: message.trim(), tokens: json.usage?.total_tokens };
    }
  };
}
