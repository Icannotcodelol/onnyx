"use client";

import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";

type SparklinePoint = { index: number; value: number };

interface LeaderboardSparklineProps {
  data: SparklinePoint[];
}

function LeaderboardSparkline({ data }: LeaderboardSparklineProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
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
  );
}

export default LeaderboardSparkline;
