"use client";

import Image from "next/image";
import { useState } from "react";

export interface Artifact {
  id: string;
  kind: "image" | "video" | "log";
  url: string;
  width?: number | null;
  height?: number | null;
  duration_ms?: number | null;
  harness_html?: string | null;
}

interface ArtifactViewerProps {
  artifacts: Artifact[];
}

export function ArtifactViewer({ artifacts }: ArtifactViewerProps) {
  const [index, setIndex] = useState(0);
  const artifact = artifacts[index];

  if (!artifact) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/40 text-sm text-slate-400">
        No artifact available yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-xl">
        {artifact.harness_html ? (
          <iframe
            srcDoc={artifact.harness_html}
            className="h-[480px] w-full border-0 bg-[#020512]"
            sandbox="allow-scripts allow-same-origin"
            title="Live code execution"
          />
        ) : artifact.kind === "image" ? (
          <Image
            src={artifact.url}
            alt="Submission artifact"
            width={artifact.width ?? 640}
            height={artifact.height ?? 360}
            className="h-full w-full object-cover"
          />
        ) : artifact.kind === "video" ? (
          <video controls className="h-full w-full" poster={artifacts.find((a) => a.kind === "image")?.url}>
            <source src={artifact.url} />
          </video>
        ) : artifact.kind === "log" ? (
          <pre className="max-h-96 overflow-y-auto bg-black/80 p-4 text-xs text-slate-200">
            {artifact.url}
          </pre>
        ) : null}
      </div>
      {artifacts.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {artifacts.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setIndex(i)}
              className={`h-2 w-8 rounded-full ${i === index ? "bg-brand-400" : "bg-white/20"}`}
              aria-label={`Show artifact ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
