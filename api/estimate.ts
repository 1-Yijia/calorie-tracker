import type { VercelRequest, VercelResponse } from "@vercel/node";

// Vercel Node serverless function: POST /api/estimate { description }
// Imports are loaded lazily inside the handler so any module-load failure
// surfaces as a readable JSON error instead of a generic crash.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const { estimateCalories } = await import("./_core.js");
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
    const result = await estimateCalories(
      String(body.description ?? ""),
      process.env.ANTHROPIC_API_KEY,
    );
    res.status(200).json(result);
  } catch (err) {
    const e = err as { status?: number; message?: string; name?: string };
    const status = typeof e.status === "number" ? e.status : 500;
    res.status(status).json({
      error: e.message || String(err),
      name: e.name,
    });
  }
}
