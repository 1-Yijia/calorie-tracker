import { estimateCalories, EstimateError } from "./_core.ts";

// Vercel Node serverless function: POST /api/estimate { description }
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  try {
    const body = (await req.json().catch(() => ({}))) as { description?: string };
    const result = await estimateCalories(
      String(body.description ?? ""),
      process.env.ANTHROPIC_API_KEY,
    );
    return json(result, 200);
  } catch (err) {
    const status = err instanceof EstimateError ? err.status : 500;
    return json({ error: (err as Error).message }, status);
  }
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
