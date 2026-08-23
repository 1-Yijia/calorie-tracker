import type { Activity, Limits, Profile } from "../types";

export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: "Sedentary (little exercise)",
  light: "Lightly active (1–3 days/wk)",
  moderate: "Moderately active (~1 hr/day)",
  active: "Very active (hard exercise 6–7 days/wk)",
  very_active: "Athlete (2× per day)",
};

export const GOAL_LABELS = {
  monitor: "Monitor nutrients",
  lose: "Lose weight",
  gain: "Gain weight",
} as const;

/** Mifflin-St Jeor basal metabolic rate (kcal/day). */
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === "female" ? base - 161 : base + 5;
}

/** Total daily energy expenditure = BMR × activity factor. */
export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY_FACTORS[p.activity];
}

/**
 * Derive daily limits from a profile + goal.
 * Reproduces the Healthy 365 reference (≈1570 / 39 / 2000) for
 * a moderately active female losing weight.
 */
export function computeLimits(p: Profile): Limits {
  const maintenance = tdee(p);

  let calories = maintenance;
  if (p.goal === "lose") calories = maintenance - 500;
  else if (p.goal === "gain") calories = maintenance + 300;

  // Safe floor so a deficit never drops below a healthy minimum.
  const floor = p.sex === "female" ? 1200 : 1500;
  calories = Math.max(floor, Math.round(calories));

  return {
    calories,
    sugarG: Math.round((calories * 0.1) / 4), // ≤10% of energy from sugar, 4 kcal/g
    sodiumMg: 2000, // HPB fixed daily recommendation
    custom: false,
  };
}
