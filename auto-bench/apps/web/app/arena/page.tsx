import { ArtifactViewer } from "@/components/ArtifactViewer";
import { VoteWidget } from "@/components/VoteWidget";
import { getArenaMatches } from "@/lib/fetchers";

export const revalidate = 0;

export default async function ArenaPage() {
  const matches = await getArenaMatches();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-4xl font-bold">Arena</h1>
      <p className="mt-3 max-w-2xl text-slate-300">
        Vote on side-by-side submissions. Each vote updates model Elo and helps us understand strengths.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {matches.map((match) => {
          const left = match.submissions.find((s) => s.id === match.submission_a);
          const right = match.submissions.find((s) => s.id === match.submission_b);

          return (
            <section key={match.id} className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-xl">
              <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-brand-300">Match</p>
                  <h2 className="text-2xl font-semibold text-white">Task {match.task_id.slice(0, 8)}…</h2>
                </div>
              </header>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <ArtifactViewer
                    artifacts={match.artifacts
                      .filter((a) => a.submission_id === match.submission_a)
                      .map((a) => ({
                        id: a.id,
                        kind: a.kind,
                        url: a.storage_path,
                        width: a.width,
                        height: a.height,
                        duration_ms: a.duration_ms
                      }))}
                  />
                  {left?.code && (
                    <div className="rounded-xl border border-white/10 bg-black/50 p-4 text-xs text-slate-300">
                      <p className="mb-2 text-brand-200">{left.model?.label}</p>
                      <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed">
                        {left.code}
                      </pre>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <ArtifactViewer
                    artifacts={match.artifacts
                      .filter((a) => a.submission_id === match.submission_b)
                      .map((a) => ({
                        id: a.id,
                        kind: a.kind,
                        url: a.storage_path,
                        width: a.width,
                        height: a.height,
                        duration_ms: a.duration_ms
                      }))}
                  />
                  {right?.code && (
                    <div className="rounded-xl border border-white/10 bg-black/50 p-4 text-xs text-slate-300">
                      <p className="mb-2 text-brand-200">{right.model?.label}</p>
                      <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed">
                        {right.code}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {left && right && (
                <div className="mt-8">
                  <VoteWidget
                    matchId={match.id}
                    leftSubmissionId={left.id}
                    rightSubmissionId={right.id}
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
