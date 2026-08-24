import type { VercelRequest, VercelResponse } from "@vercel/node";
import { estimateCalories, EstimateError } from "./_core";

// Vercel Node serverless function: POST /api/estimate { description }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
    const result = await estimateCalories(
      String(body.description ?? ""),
      process.env.ANTHROPIC_API_KEY,
    );
    res.status(200).json(result);
  } catch (err) {
    const status = err instanceof EstimateError ? err.status : 500;
    res.status(status).json({ error: (err as Error).message });
  }
}
