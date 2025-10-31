"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_fastify = __toESM(require("fastify"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_pngjs = require("pngjs");
var import_crypto = require("crypto");

// src/buildHarness.ts
var shared = __toESM(require("@autobench/shared"), 1);
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
import_dotenv.default.config();
var PORT = Number(process.env.PORT ?? 4e3);
var HOST = process.env.HOST ?? "0.0.0.0";
var app = (0, import_fastify.default)({ logger: true });
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
  const png = new import_pngjs.PNG({ width, height });
  const hash = (0, import_crypto.createHash)("sha256").update(harness.html).digest();
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
  const buffer = import_pngjs.PNG.sync.write(png);
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
