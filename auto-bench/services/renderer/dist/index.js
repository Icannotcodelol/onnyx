// src/index.ts
import Fastify from "fastify";
import dotenv from "dotenv";
import { PNG } from "pngjs";
import { createHash } from "crypto";

// src/buildHarness.ts
import * as shared from "@autobench/shared";
var { sanitizeSubmissionCode } = shared;
function buildHarness(runtime, code) {
  const sanitized = sanitizeSubmissionCode(code);
  if (runtime === "js-browser") {
    const codeWithoutExports = sanitized.replace(/export\s+(function|const|let|var|default)/g, "$1");
    const html2 = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>AutoBench Runtime</title>
    <style>
      html, body { margin: 0; padding: 0; background: #020512; color: white; font-family: sans-serif; }
      canvas { width: 100vw; height: 100vh; display: block; }
    </style>
  </head>
  <body>
    <canvas id="autobench-canvas" width="1280" height="720"></canvas>
    <script>
      ${codeWithoutExports}
      
      // Try to call render function if it exists (supports render, harness, or IIFE)
      const canvas = document.getElementById('autobench-canvas');
      const audio = new Float32Array(128);
      
      try {
        if (typeof render === 'function') {
          render(canvas, audio);
        } else if (typeof harness === 'function') {
          harness(audio);
        }
        // If IIFE, it already executed
      } catch (error) {
        console.error('Execution error:', error);
        document.body.innerHTML = '<pre style="color:red;padding:20px;">Error: ' + error.message + '</pre>';
      }
    </script>
  </body>
</html>`;
    return { runtime, html: html2 };
  }
  const html = `<!DOCTYPE html><html><body><pre>Runtime ${runtime} is not yet implemented.</pre></body></html>`;
  return { runtime, html };
}

// src/index.ts
dotenv.config();
var PORT = Number(process.env.PORT ?? 4e3);
var HOST = process.env.HOST ?? "0.0.0.0";
var app = Fastify({ logger: true });
app.get("/health", () => ({ status: "ok" }));
app.post("/render", async (request, reply) => {
  const body = request.body;
  if (!body?.runtime || !body?.code) {
    reply.code(400);
    return { error: "runtime and code are required" };
  }
  const harness = buildHarness(body.runtime, body.code);
  const width = 640;
  const height = 360;
  const png = new PNG({ width, height });
  const hash = createHash("sha256").update(harness.html).digest();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = width * y + x << 2;
      const shade = hash[(x + y) % hash.length];
      png.data[idx] = shade;
      png.data[idx + 1] = hash[(x + 7) % hash.length];
      png.data[idx + 2] = hash[(y + 13) % hash.length];
      png.data[idx + 3] = 255;
    }
  }
  const buffer = PNG.sync.write(png);
  const thumbnail = buffer.toString("base64");
  reply.code(200);
  return {
    harness: harness.html,
    thumbnail,
    width,
    height
  };
});
app.listen({ port: PORT, host: HOST }).then(() => {
  console.log(`Renderer listening on http://${HOST}:${PORT}`);
});
