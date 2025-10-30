import { sanitizeSubmissionCode } from "@autobench/shared";

type SupportedRuntime = "js-browser" | "js-server" | "python";

export interface HarnessBuild {
  runtime: SupportedRuntime;
  html: string;
}

export function buildHarness(runtime: SupportedRuntime, code: string): HarnessBuild {
  const sanitized = sanitizeSubmissionCode(code);

  if (runtime === "js-browser") {
    const html = `<!DOCTYPE html>
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
    <script type="module">
      ${sanitized}
      if (typeof render === 'function') {
        const canvas = document.getElementById('autobench-canvas');
        const audio = new Float32Array(0);
        try {
          render(canvas, audio);
        } catch (error) {
          console.error('Render error', error);
        }
      }
    </script>
  </body>
</html>`;
    return { runtime, html };
  }

  const html = `<!DOCTYPE html><html><body><pre>Runtime ${runtime} is not yet implemented.</pre></body></html>`;
  return { runtime, html };
}
