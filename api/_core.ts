import Anthropic from "@anthropic-ai/sdk";

export type Estimate = {
  foodName: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "low" | "medium" | "high";
  assumptions: string;
};

const MODEL = "claude-haiku-4-5-20251001";
const MAX_DESCRIPTION_LEN = 400;

const TOOL: Anthropic.Tool = {
  name: "log_food",
  description: "Record the nutrition estimate for a described food/meal.",
  input_schema: {
    type: "object",
    properties: {
      foodName: { type: "string", description: "Concise name of the food/meal." },
      quantity: {
        type: "string",
        description:
          "The portion you assumed, e.g. '2 tablespoons (dry)', '1 medium bowl'.",
      },
      calories: { type: "number", description: "Best estimate of total kcal." },
      protein: { type: "number", description: "Grams of protein." },
      carbs: { type: "number", description: "Grams of carbohydrate." },
      fat: { type: "number", description: "Grams of fat." },
      confidence: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "How confident the estimate is, given how specific the input was.",
      },
      assumptions: {
        type: "string",
        description:
          "Short note on any assumptions (portion size, preparation). Empty string if none.",
      },
    },
    required: [
      "foodName",
      "quantity",
      "calories",
      "protein",
      "carbs",
      "fat",
      "confidence",
      "assumptions",
    ],
  },
};

const SYSTEM = `You are a nutrition estimation assistant for a personal calorie tracker.
The user describes food casually and imprecisely, e.g. "two big spoons of oats",
"a handful of almonds", "medium latte". Interpret casual quantities sensibly:
- "big spoon" ≈ tablespoon, "spoon"/"teaspoon" ≈ teaspoon unless context says otherwise.
- "a handful" ≈ ~30 g for nuts/snacks.
- When a portion is ambiguous, assume a typical single serving and say so in assumptions.
Estimate total calories and macros for the WHOLE described amount, not per 100 g.
Return whole numbers. Prefer being useful over refusing; always produce an estimate.
Always respond by calling the log_food tool.`;

/** Thrown for client-fixable problems (bad input, missing key). */
export class EstimateError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function estimateCalories(
  description: string,
  apiKey: string | undefined,
): Promise<Estimate> {
  const text = description.trim();
  if (!text) throw new EstimateError("Please describe what you ate.");
  if (text.length > MAX_DESCRIPTION_LEN)
    throw new EstimateError("Description is too long.");
  if (!apiKey)
    throw new EstimateError(
      "Server is missing ANTHROPIC_API_KEY. Set it in your environment.",
      500,
    );

  const client = new Anthropic({ apiKey });

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "log_food" },
    messages: [{ role: "user", content: text }],
  });

  const toolUse = msg.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolUse) throw new EstimateError("Could not estimate this food.", 502);

  const raw = toolUse.input as Partial<Estimate>;
  return {
    foodName: String(raw.foodName ?? text),
    quantity: String(raw.quantity ?? ""),
    calories: Math.max(0, Math.round(Number(raw.calories) || 0)),
    protein: Math.max(0, Math.round(Number(raw.protein) || 0)),
    carbs: Math.max(0, Math.round(Number(raw.carbs) || 0)),
    fat: Math.max(0, Math.round(Number(raw.fat) || 0)),
    confidence:
      raw.confidence === "high" || raw.confidence === "medium"
        ? raw.confidence
        : "low",
    assumptions: String(raw.assumptions ?? ""),
  };
}
