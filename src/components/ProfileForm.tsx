import { useEffect, useState } from "react";
import type { Activity, Goal, Limits, Profile, Sex } from "../types";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  computeLimits,
} from "../lib/limits";

const GOALS: Goal[] = ["monitor", "lose", "gain"];
const ACTIVITIES: Activity[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];

const GOAL_HINTS: Record<Goal, string> = {
  monitor: "Maintain — target = your daily needs",
  lose: "Calorie deficit (−500/day)",
  gain: "Calorie surplus (+300/day)",
};

export function ProfileForm({
  initialProfile,
  initialLimits,
  allowOverride,
  submitLabel,
  onSubmit,
}: {
  initialProfile: Profile;
  initialLimits?: Limits;
  allowOverride: boolean;
  submitLabel: string;
  onSubmit: (profile: Profile, limits: Limits) => void;
}) {
  const [p, setP] = useState<Profile>(initialProfile);
  const [limits, setLimits] = useState<Limits>(
    initialLimits ?? computeLimits(initialProfile),
  );

  const valid =
    p.age > 0 && p.age < 120 && p.heightCm > 50 && p.weightKg > 20;

  // Keep limits in sync with the profile unless the user has overridden them.
  useEffect(() => {
    if (!limits.custom && valid) setLimits(computeLimits(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setP((prev) => ({ ...prev, [key]: value }));
  }
  function setLimit(key: keyof Limits, value: number) {
    setLimits((prev) => ({ ...prev, [key]: value, custom: true }));
  }

  return (
    <div>
      <div className="field">
        <label>Goal</label>
        <div className="choices">
          {GOALS.map((g) => (
            <button
              key={g}
              type="button"
              className={`choice ${p.goal === g ? "sel" : ""}`}
              onClick={() => set("goal", g)}
            >
              {GOAL_LABELS[g]}
              <small>{GOAL_HINTS[g]}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Sex</label>
        <div className="choices two">
          {(["female", "male"] as Sex[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`choice ${p.sex === s ? "sel" : ""}`}
              onClick={() => set("sex", s)}
              style={{ textTransform: "capitalize" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Age</label>
        <input
          type="number"
          inputMode="numeric"
          value={p.age || ""}
          onChange={(e) => set("age", Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label>Height (cm)</label>
        <input
          type="number"
          inputMode="numeric"
          value={p.heightCm || ""}
          onChange={(e) => set("heightCm", Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label>Weight (kg)</label>
        <input
          type="number"
          inputMode="decimal"
          value={p.weightKg || ""}
          onChange={(e) => set("weightKg", Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label>Activity level</label>
        <select
          className="choice"
          style={{ width: "100%" }}
          value={p.activity}
          onChange={(e) => set("activity", e.target.value as Activity)}
        >
          {ACTIVITIES.map((a) => (
            <option key={a} value={a}>
              {ACTIVITY_LABELS[a]}
            </option>
          ))}
        </select>
      </div>

      {/* computed / editable limits */}
      <div className="card pad" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginTop: 0 }}>
          Your daily targets
        </div>
        {allowOverride ? (
          <>
            <div className="field">
              <label>Calories (kcal)</label>
              <input
                type="number"
                inputMode="numeric"
                value={limits.calories || ""}
                onChange={(e) => setLimit("calories", Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Sugar (g)</label>
              <input
                type="number"
                inputMode="numeric"
                value={limits.sugarG || ""}
                onChange={(e) => setLimit("sugarG", Number(e.target.value))}
              />
            </div>
            <div className="field" style={{ marginBottom: 4 }}>
              <label>Sodium (mg)</label>
              <input
                type="number"
                inputMode="numeric"
                value={limits.sodiumMg || ""}
                onChange={(e) => setLimit("sodiumMg", Number(e.target.value))}
              />
            </div>
            {limits.custom && valid && (
              <button
                type="button"
                className="btn ghost block"
                onClick={() => setLimits(computeLimits(p))}
              >
                Recompute from profile
              </button>
            )}
          </>
        ) : (
          <div className="tnum" style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.9 }}>
            <div>🔥 {limits.calories.toLocaleString()} kcal</div>
            <div>🍬 {limits.sugarG} g sugar</div>
            <div>🧂 {limits.sodiumMg.toLocaleString()} mg sodium</div>
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn primary block"
        disabled={!valid}
        onClick={() => onSubmit(p, limits)}
      >
        {submitLabel}
      </button>
    </div>
  );
}
