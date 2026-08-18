export type Confidence = "low" | "medium" | "high";

export type Estimate = {
  foodName: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: Confidence;
  assumptions: string;
};

export type Entry = {
  id: string;
  date: string; // local day, "YYYY-MM-DD"
  description: string; // what the user typed
  foodName: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: Confidence;
  createdAt: number; // epoch ms
};
