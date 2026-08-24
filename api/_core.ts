import type Anthropic from "@anthropic-ai/sdk";

export type Estimate = {
  foodName: string;
  unit: string;
  defaultQuantity: number;
  caloriesPerUnit: number;
  sugarPerUnitG: number;
  sodiumPerUnitMg: number;
  confidence: "low" | "medium" | "high";
  assumptions: string;
};

const MODEL = "claude-haiku-4-5-20251001";
const MAX_DESCRIPTION_LEN = 400;

const TOOL: Anthropic.Tool = {
  name: "log_food",
  description: "Record a reusable per-unit nutrition estimate for a described food/drink.",
  input_schema: {
    type: "object",
    properties: {
      foodName: {
        type: "string",
        description: "Concise, reusable name of the food/drink (no quantity in it).",
      },
      unit: {
        type: "string",
        description:
          "A natural single serving unit for this food, e.g. 'whole', 'slice', 'bowl', 'cup', 'tbsp', 'piece', 'can', '100 g'.",
      },
      defaultQuantity: {
        type: "number",
        description:
          "How many of that unit the user's phrase implies (e.g. 'two big spoons' -> 2). Default 1 if unspecified.",
      },
      caloriesPerUnit: { type: "number", description: "kcal in ONE unit." },
      sugarPerUnitG: { type: "number", description: "grams of sugar in ONE unit." },
      sodiumPerUnitMg: { type: "number", description: "mg of sodium in ONE unit." },
      confidence: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Confidence given how specific the description was.",
      },
      assumptions: {
        type: "string",
        description: "Brief note on assumptions (unit size, preparation). Empty string if none.",
      },
    },
    required: [
      "foodName",
      "unit",
      "defaultQuantity",
      "caloriesPerUnit",
      "sugarPerUnitG",
      "sodiumPerUnitMg",
      "confidence",
      "assumptions",
    ],
  },
};

const SYSTEM = `You are a nutrition estimator for a personal meal tracker (Singapore context).
The user describes food casually, e.g. "two big spoons of oats", "kopi o", "a handful of almonds",
"plain omelette". Your job:
1. Identify the food and give it a concise reusable name (no quantity in the name).
2. Choose a natural single-serving UNIT for it (whole, slice, bowl, cup, tbsp, piece, can, 100 g...).
   - "big spoon" -> tbsp; "spoon"/"teaspoon" -> tsp; snacks by handful -> a sensible gram/piece unit.
3. Estimate calories, sugar (g) and sodium (mg) for ONE unit — NOT for the whole phrase.
4. Put any quantity implied by the phrase into defaultQuantity (e.g. "two big spoons" -> 2); else 1.
Estimate real Singaporean/hawker portions where relevant. Return whole numbers. Always be useful and
produce an estimate; never refuse. Always answer by calling the log_food tool.`;

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
  if (!text) throw new EstimateError("Please describe the food.");
  if (text.length > MAX_DESCRIPTION_LEN)
    throw new EstimateError("Description is too long.");
  if (!apiKey)
    throw new EstimateError(
      "Server is missing ANTHROPIC_API_KEY. Set it in your environment.",
      500,
    );

  const { default: AnthropicClient } = await import("@anthropic-ai/sdk");
  const client = new AnthropicClient({ apiKey });

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
  const num = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
  const qty = Number(raw.defaultQuantity);

  return {
    foodName: String(raw.foodName ?? text).trim(),
    unit: String(raw.unit ?? "serving").trim() || "serving",
    defaultQuantity: qty > 0 ? Math.round(qty * 100) / 100 : 1,
    caloriesPerUnit: num(raw.caloriesPerUnit),
    sugarPerUnitG: num(raw.sugarPerUnitG),
    sodiumPerUnitMg: num(raw.sodiumPerUnitMg),
    confidence:
      raw.confidence === "high" || raw.confidence === "medium"
        ? raw.confidence
        : "low",
    assumptions: String(raw.assumptions ?? ""),
  };
}
