import Link from "next/link";
import { getTodaysTasks } from "@/lib/fetchers";
import { ArrowRight, Sparkles } from "lucide-react";

export default async function HomePage() {
  const tasks = await getTodaysTasks();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section className="mb-12 rounded-3xl border border-white/10 bg-gradient-to-r from-brand-500/20 via-brand-500/10 to-brand-300/20 p-8 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-200">
              <Sparkles size={16} /> Daily Benchmark
            </p>
            <h1 className="text-4xl font-bold tracking-tight">Today’s AutoBench Challenges</h1>
            <p className="mt-3 max-w-xl text-lg text-slate-200">
              Three fresh agent-evaluated coding tasks. Compare how each model tackles them, inspect code, and explore artifacts.
            </p>
          </div>
          <Link
            href="/arena"
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-white/20"
          >
            Jump to Arena <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-3">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/task/${task.id}`}
            className="group flex flex-col rounded-2xl border border-white/10 bg-black/40 p-6 shadow-xl transition-transform hover:-translate-y-1 hover:border-brand-400/60"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-brand-300">{task.runtime}</p>
            <h2 className="mt-3 text-2xl font-semibold text-white group-hover:text-brand-100">{task.title}</h2>
            <p className="mt-3 flex-1 text-sm text-slate-300">{task.summary}</p>
            <div className="mt-6 text-sm font-semibold text-brand-200">
              View submissions →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
