import type { Limits, Nutrients } from "../types";

function status(consumed: number, limit: number): string {
  if (limit <= 0) return "";
  const pct = consumed / limit;
  if (pct > 1) return "over";
  if (pct >= 0.9) return "warn";
  return "";
}

function Bar({
  label,
  consumed,
  limit,
  unit,
}: {
  label: string;
  consumed: number;
  limit: number;
  unit: string;
}) {
  const pct = limit > 0 ? Math.min(100, (consumed / limit) * 100) : 0;
  return (
    <div className="nrow">
      <div className="nrow-top">
        <span className="label">{label}</span>
        <span className="val tnum">
          {consumed.toLocaleString()}
          {unit} <span className="lim">/ {limit.toLocaleString()}{unit}</span>
        </span>
      </div>
      <div className={`bar ${status(consumed, limit)}`}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function NutrientCard({
  totals,
  limits,
  onEditLimits,
  onViewSummary,
}: {
  totals: Nutrients;
  limits: Limits;
  onEditLimits: () => void;
  onViewSummary: () => void;
}) {
  return (
    <div className="card">
      <div className="nutri">
        <h2>Nutrients intake</h2>
        <Bar label="Calories" unit="" consumed={totals.calories} limit={limits.calories} />
        <Bar label="Sugar (g)" unit="" consumed={totals.sugarG} limit={limits.sugarG} />
        <Bar
          label="Sodium (mg)"
          unit=""
          consumed={totals.sodiumMg}
          limit={limits.sodiumMg}
        />
      </div>
      <div className="card-actions">
        <button onClick={onEditLimits}>Edit daily limits</button>
        <button onClick={onViewSummary}>View daily summary</button>
      </div>
    </div>
  );
}
