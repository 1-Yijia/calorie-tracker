import type { VercelRequest, VercelResponse } from "@vercel/node";

// Diagnostic: a zero-dependency function to confirm /api functions run at all.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true, runtime: process.version });
}
