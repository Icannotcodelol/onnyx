import fetch from "node-fetch";
import { Provider } from "../types";
import { TaskSpec } from "@autobench/shared";

const fallbackCode = `export function render(canvas) {
  const ctx = canvas.getContext('2d');
  const dots = new Array(80).fill(0).map((_, i) => ({
    angle: (i / 80) * Math.PI * 2,
    radius: 50 + i,
    speed: 0.005 + (i % 5) * 0.001
  }));
  function frame(time) {
    ctx.fillStyle = '#050a24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    dots.forEach((dot, i) => {
      const r = dot.radius + Math.sin(time * dot.speed) * 12;
      const x = canvas.width / 2 + Math.cos(dot.angle + time * dot.speed) * r;
      const y = canvas.height / 2 + Math.sin(dot.angle + time * dot.speed) * r;
      ctx.fillStyle = ` + "`" + `rgba(108,125,255,0.7)` + "`" + `;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}`;

export function createDeepSeekProvider(apiKey?: string): Provider {
  return {
    id: "deepseek",
    label: "DeepSeek",
    async call(spec: TaskSpec, systemPrompt: string) {
      if (!apiKey) {
        return { code: fallbackCode };
      }

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-coder",
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 1200,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Task: ${spec.title}\nDescription: ${spec.summary}\nAcceptance: ${spec.acceptanceCriteria.join("; ")}\nLimits: maxLines=250, initMs=1000, runMs=15000\nReturn only code.`
            }
          ]
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`DeepSeek error: ${text}`);
      }

      const json: any = await response.json();
      const message = json.choices?.[0]?.message?.content;
      if (!message) {
        throw new Error("DeepSeek returned no content");
      }
      return { code: message.trim(), tokens: json.usage?.total_tokens };
    }
  };
}
