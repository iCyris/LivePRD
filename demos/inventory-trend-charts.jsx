import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../apps/web/src/components/ui/card.jsx";

const barData = [
  { label: "Mon", value: 12 },
  { label: "Tue", value: 19 },
  { label: "Wed", value: 15 },
  { label: "Thu", value: 24 },
  { label: "Fri", value: 18 },
  { label: "Sat", value: 9 },
];

const lineData = [
  { label: "W1", value: 46 },
  { label: "W2", value: 38 },
  { label: "W3", value: 29 },
  { label: "W4", value: 21 },
  { label: "W5", value: 18 },
];

function BarChart() {
  const max = Math.max(...barData.map((item) => item.value));

  return (
    <svg className="h-[220px] w-full" viewBox="0 0 420 220">
      <line x1="36" x2="396" y1="182" y2="182" stroke="rgba(148,163,184,0.4)" strokeWidth="1" />
      <line x1="36" x2="36" y1="26" y2="182" stroke="rgba(148,163,184,0.4)" strokeWidth="1" />
      {barData.map((item, index) => {
        const height = (item.value / max) * 124;
        const x = 52 + index * 58;
        const y = 182 - height;
        return (
          <g key={item.label}>
            <rect
              fill="rgba(37,99,235,0.16)"
              height={height}
              rx="10"
              width="34"
              x={x}
              y={y}
            />
            <rect
              fill="rgba(37,99,235,0.72)"
              height={Math.max(18, height * 0.62)}
              rx="10"
              width="34"
              x={x}
              y={182 - Math.max(18, height * 0.62)}
            />
            <text fill="currentColor" fontSize="11" textAnchor="middle" x={x + 17} y="202">
              {item.label}
            </text>
            <text fill="currentColor" fontSize="11" fontWeight="600" textAnchor="middle" x={x + 17} y={y - 8}>
              {item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart() {
  const max = Math.max(...lineData.map((item) => item.value));
  const min = Math.min(...lineData.map((item) => item.value));
  const points = lineData.map((item, index) => {
    const x = 46 + index * 84;
    const ratio = (item.value - min) / Math.max(1, max - min);
    const y = 172 - ratio * 118;
    return { ...item, x, y };
  });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `46,182 ${polyline} ${points.at(-1)?.x ?? 382},182`;

  return (
    <svg className="h-[220px] w-full" viewBox="0 0 420 220">
      <line x1="36" x2="396" y1="182" y2="182" stroke="rgba(148,163,184,0.4)" strokeWidth="1" />
      <line x1="36" x2="36" y1="26" y2="182" stroke="rgba(148,163,184,0.4)" strokeWidth="1" />
      <polygon fill="rgba(16,185,129,0.12)" points={area} />
      <polyline
        fill="none"
        points={polyline}
        stroke="rgba(16,185,129,0.95)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} fill="white" r="6" stroke="rgba(16,185,129,0.95)" strokeWidth="3" />
          <text fill="currentColor" fontSize="11" textAnchor="middle" x={point.x} y="202">
            {point.label}
          </text>
          <text fill="currentColor" fontSize="11" fontWeight="600" textAnchor="middle" x={point.x} y={point.y - 12}>
            {point.value}m
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function InventoryTrendCharts() {
  return (
    <Card className="border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] shadow-[var(--prd-shadow)]">
      <CardHeader className="gap-2">
        <CardTitle className="text-xl">Chart component rendering</CardTitle>
        <CardDescription className="text-sm leading-6">
          This block uses native SVG to preview chart-like components inside the PRD, including a daily exception bar chart and a weekly response-time trend line.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[calc(var(--prd-radius)-2px)] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] p-4">
          <div className="mb-3 space-y-1">
            <h4 className="text-sm font-semibold">Daily critical exceptions</h4>
            <p className="text-sm leading-6 text-[color:var(--prd-muted)]">
              Bar chart sample for volume comparison across days.
            </p>
          </div>
          <BarChart />
        </section>

        <section className="rounded-[calc(var(--prd-radius)-2px)] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] p-4">
          <div className="mb-3 space-y-1">
            <h4 className="text-sm font-semibold">Median first-action time</h4>
            <p className="text-sm leading-6 text-[color:var(--prd-muted)]">
              Line chart sample for weekly trend direction and delta visibility.
            </p>
          </div>
          <LineChart />
        </section>
      </CardContent>
    </Card>
  );
}
