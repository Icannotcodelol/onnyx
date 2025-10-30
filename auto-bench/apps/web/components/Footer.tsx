export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/40 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
        <p>© {new Date().getFullYear()} AutoBench. Automated benchmarks for the agentic era.</p>
        <div className="flex gap-4">
          <a href="https://supabase.com" target="_blank" rel="noreferrer" className="hover:text-brand-200">
            Powered by Supabase
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-brand-200">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
