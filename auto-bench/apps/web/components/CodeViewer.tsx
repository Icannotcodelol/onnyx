"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface CodeViewerProps {
  code: string;
}

export function CodeViewer({ code }: CodeViewerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-black/50 p-4">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>Submission code</span>
        <button
          className="text-brand-300 hover:text-brand-200"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>
      <div className={`transition-[max-height] duration-500 ${expanded ? "max-h-[600px]" : "max-h-48"} overflow-hidden`}>    
        <SyntaxHighlighter language="javascript" style={dracula} customStyle={{ background: "transparent" }}>
          {code.trim() || "// no code submitted"}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
