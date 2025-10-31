import * as shared from "@autobench/shared";

const { sanitizeSubmissionCode } = shared;

type SupportedRuntime = "js-browser" | "js-server" | "python";

export interface HarnessBuild {
  runtime: SupportedRuntime;
  html: string;
}

export function buildHarness(runtime: SupportedRuntime, code: string): HarnessBuild {
  const sanitized = sanitizeSubmissionCode(code);

  if (runtime === "js-browser") {
    // Remove export keywords so functions are accessible
    const codeWithoutExports = sanitized.replace(/export\s+(function|const|let|var|default)/g, '$1');
    
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
    return { runtime, html };
  }

  const html = `<!DOCTYPE html><html><body><pre>Runtime ${runtime} is not yet implemented.</pre></body></html>`;
  return { runtime, html };
}
