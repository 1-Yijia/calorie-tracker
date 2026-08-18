import type { Entry } from "../types";

export function DailyTotal({ entries }: { entries: Entry[] }) {
  const calories = entries.reduce((s, e) => s + e.calories, 0);
  const protein = entries.reduce((s, e) => s + e.protein, 0);
  const carbs = entries.reduce((s, e) => s + e.carbs, 0);
  const fat = entries.reduce((s, e) => s + e.fat, 0);

  return (
    <div className="total">
      <div className="total-number">{calories.toLocaleString()}</div>
      <div className="total-label">calories today</div>
      <div className="macros">
        <span>
          <strong>{protein}</strong>g protein
        </span>
        <span>
          <strong>{carbs}</strong>g carbs
        </span>
        <span>
          <strong>{fat}</strong>g fat
        </span>
      </div>
    </div>
  );
}
