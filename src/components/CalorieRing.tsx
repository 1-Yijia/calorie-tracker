export function CalorieRing({
  consumed,
  limit,
  size = 34,
  stroke = 4,
}: {
  consumed: number;
  limit: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = limit > 0 ? consumed / limit : 0;
  const fill = Math.min(Math.max(pct, 0), 1);
  const over = limit > 0 && consumed > limit;
  const has = consumed > 0;
  const color = over ? "var(--over)" : "var(--good)";
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth={stroke}
      />
      {has && (
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * fill} ${c}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      )}
    </svg>
  );
}
