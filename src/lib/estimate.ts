import type { Estimate } from "../types";

/** Calls our backend proxy, which holds the API key and calls Claude. */
export async function estimate(description: string): Promise<Estimate> {
  const res = await fetch("/api/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Estimate failed (${res.status})`);
  return data as Estimate;
}
