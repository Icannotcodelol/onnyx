import { getLeaderboard } from "@/lib/fetchers";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

export const revalidate = 60;

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-bold">Leaderboard</h1>
      <p className="mt-3 text-slate-300">
        Elo ratings reflect community votes. Sideloaded sparkline shows the last 10 matches per model.
      </p>

      <div className="mt-8 space-y-4">
        {leaderboard.map((entry) => (
          <div
            key={entry.model_id}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-xl sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-300">{entry.provider_name}</p>
              <h2 className="text-2xl font-semibold text-white">{entry.model_label}</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-slate-400">Rating</p>
                <p className="text-3xl font-bold text-brand-100">{entry.rating}</p>
              </div>
              <div className="h-16 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(entry.sparkline ?? []).map((value, index) => ({ index, value }))}>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10, 14, 40, 0.9)",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff"
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#6b7dff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
