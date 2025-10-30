import { ArtifactViewer } from "@/components/ArtifactViewer";
import { CodeViewer } from "@/components/CodeViewer";
import { getTaskDetail } from "@/lib/fetchers";
import { notFound } from "next/navigation";

interface TaskPageProps {
  params: {
    id: string;
  };
}

export default async function TaskDetailPage({ params }: TaskPageProps) {
  try {
    const { task, submissions, artifacts } = await getTaskDetail(params.id);

    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-300">{task.runtime}</p>
          <h1 className="mt-2 text-4xl font-bold text-white">{task.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">{task.summary}</p>
        </header>

        <section className="mb-12 grid gap-8 rounded-3xl border border-white/10 bg-black/40 p-8 shadow-xl lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-xl font-semibold text-white">Specification</h2>
            <div className="mt-4 space-y-6 text-sm text-slate-300">
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-brand-200">Instructions</h3>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">{task.instructions}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-brand-200">Acceptance criteria</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5">
                  {task.acceptanceCriteria.map((criterion) => (
                    <li key={criterion}>{criterion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
            <h3 className="text-xs uppercase tracking-[0.3em] text-brand-200">Starter code</h3>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-relaxed">
              {task.starter.code}
            </pre>
          </div>
        </section>

        <section className="space-y-10">
          <h2 className="text-2xl font-semibold text-white">Submissions</h2>
          {submissions.map((submission) => (
            <article key={submission.id} className="grid gap-6 rounded-3xl border border-white/10 bg-black/30 p-8 shadow-xl lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-300">Model</p>
                  <h3 className="text-xl font-semibold text-white">{submission.model?.label}</h3>
                  <p className="text-xs text-slate-400">Status: {submission.status}</p>
                </div>
                <ArtifactViewer
                  artifacts={artifacts
                    .filter((artifact) => artifact.submission_id === submission.id)
                    .map((artifact) => ({
                      id: artifact.id,
                      kind: artifact.kind,
                      url: artifact.storage_path,
                      width: artifact.width,
                      height: artifact.height,
                      duration_ms: artifact.duration_ms
                    }))}
                />
              </div>
              <CodeViewer code={submission.code ?? ""} />
            </article>
          ))}
        </section>
      </div>
    );
  } catch (error) {
    console.error(error);
    notFound();
  }
}
