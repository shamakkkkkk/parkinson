import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = {
  step: "#2b6ef2",
  mouth: "#0f9488",
  sound: "#d97706",
  speed: "#dc2626",
};

/** Renders one metric's series, or an empty state when no data is available yet - never fabricated sample data. */
export default function GraphCard({ title, yLabel, xLabel, colorKey = "step", data = [] }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="graph-card">
      <div className="graph-card-title">{title}</div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="x" label={{ value: xLabel, position: "insideBottom", offset: -5, fontSize: 11 }} tick={{ fontSize: 11 }} />
            <YAxis label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11 }} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="y" stroke={COLORS[colorKey] || COLORS.step} dot={{ r: 3 }} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="graph-empty">No data recorded for this metric yet.</div>
      )}
    </div>
  );
}
