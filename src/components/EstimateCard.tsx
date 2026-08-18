import { useState } from "react";
import type { Estimate } from "../types";

export function EstimateCard({
  description,
  estimate,
  onSave,
  onDiscard,
}: {
  description: string;
  estimate: Estimate;
  onSave: (calories: number) => void;
  onDiscard: () => void;
}) {
  const [calories, setCalories] = useState(String(estimate.calories));

  const kcal = Math.max(0, Math.round(Number(calories) || 0));

  return (
    <div className="estimate-card">
      <div className="estimate-head">
        <div>
          <div className="estimate-food">{estimate.foodName}</div>
          <div className="estimate-sub">
            “{description}”{estimate.quantity ? ` · ${estimate.quantity}` : ""}
          </div>
        </div>
        <span className={`confidence ${estimate.confidence}`}>
          {estimate.confidence}
        </span>
      </div>

      <label className="cal-edit">
        <span>Calories (tap to adjust)</span>
        <input
          type="number"
          inputMode="numeric"
          value={calories}
          min={0}
          onChange={(e) => setCalories(e.target.value)}
        />
      </label>

      <div className="estimate-macros">
        <span>{estimate.protein}g protein</span>
        <span>{estimate.carbs}g carbs</span>
        <span>{estimate.fat}g fat</span>
      </div>

      {estimate.assumptions && (
        <p className="assumptions">Assumed: {estimate.assumptions}</p>
      )}

      <div className="estimate-actions">
        <button className="secondary" onClick={onDiscard}>
          Discard
        </button>
        <button className="primary" onClick={() => onSave(kcal)}>
          Add {kcal} cal
        </button>
      </div>
    </div>
  );
}
