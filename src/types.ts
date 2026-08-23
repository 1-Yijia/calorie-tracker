export type Goal = "monitor" | "lose" | "gain";
export type Sex = "female" | "male";
export type Activity =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type MealSlotId =
  | "early"
  | "morning"
  | "midday"
  | "afternoon"
  | "evening"
  | "night";

export type Confidence = "low" | "medium" | "high";

/** The three nutrients the app tracks. */
export type Nutrients = {
  calories: number; // kcal
  sugarG: number; // grams
  sodiumMg: number; // milligrams
};

export type Profile = {
  goal: Goal;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
};

export type Limits = Nutrients & {
  /** true if the user hand-edited limits away from the computed values. */
  custom: boolean;
};

/** A reusable food definition — the cache + favourites list. */
export type FoodItem = {
  id: string;
  name: string;
  unit: string; // "whole" | "bowl" | "cup" | "slice" | "tbsp" | "serving" | "100 g" ...
  perUnit: Nutrients; // nutrition for ONE unit
  favourite: boolean;
  useCount: number;
  lastUsedAt: number;
  source: "ai" | "manual";
};

/** One logged consumption. Snapshots the item so later edits don't rewrite history. */
export type LogEntry = {
  id: string;
  date: string; // "YYYY-MM-DD" (local day)
  slot: MealSlotId;
  foodItemId: string;
  name: string;
  unit: string;
  perUnit: Nutrients;
  quantity: number; // number of units/portions
  createdAt: number;
};

/** What the AI endpoint returns for a described food (per single unit). */
export type Estimate = {
  foodName: string;
  unit: string;
  defaultQuantity: number;
  caloriesPerUnit: number;
  sugarPerUnitG: number;
  sodiumPerUnitMg: number;
  confidence: Confidence;
  assumptions: string;
};
