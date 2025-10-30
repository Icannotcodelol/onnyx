import Fastify from "fastify";
import dotenv from "dotenv";
import { PNG } from "pngjs";
import { createHash } from "crypto";
import { buildHarness } from "./buildHarness";

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });

app.get("/health", () => ({ status: "ok" }));

app.post("/render", async (request, reply) => {
  const body = request.body as { runtime: "js-browser" | "js-server" | "python"; code: string };
  if (!body?.runtime || !body?.code) {
    reply.code(400);
    return { error: "runtime and code are required" };
  }

  const harness = buildHarness(body.runtime, body.code);

  // Fake rendering with deterministic pattern derived from harness html to avoid executing untrusted code.
  const width = 640;
  const height = 360;
  const png = new PNG({ width, height });
  const hash = createHash("sha256").update(harness.html).digest();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
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
