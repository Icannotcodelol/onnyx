import fetch from "node-fetch";
import { Provider } from "../types";
import type { TaskSpec } from "@autobench/shared";
import { buildModelPrompt } from "../harness";

const fallbackCode = `export function render(canvas) {
  const ctx = canvas.getContext('2d');
  let t = 0;
  function frame() {
    t += 0.016;
    ctx.fillStyle = '#050a24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 120; i++) {
      const angle = (i / 120) * Math.PI * 2 + t;
      const radius = 120 + Math.sin(t * 4 + i) * 40;
      const x = canvas.width / 2 + Math.cos(angle) * radius;
      const y = canvas.height / 2 + Math.sin(angle) * radius;
      ctx.fillStyle = ` + "`" + `rgba(108,125,255,0.5)` + "`" + `;
      ctx.fillRect(x, y, 4, 4);
    }
    requestAnimationFrame(frame);
  }
  frame();
}`;

export function createGoogleProvider(apiKey?: string): Provider {
  return {
    id: "google",
    label: "Google",
    async call(spec: TaskSpec, systemPrompt: string) {
      if (!apiKey) {
        return { code: fallbackCode };
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}\n\n${buildModelPrompt(spec)}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 4000
          }
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Google error: ${text}`);
      }

      const json: any = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Google returned no content");
      }
      return { code: text.trim() };
    }
  };
}
