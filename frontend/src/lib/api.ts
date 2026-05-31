import type { IndicatorsResponse, AnalysisResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchIndicators(coin: string = "BTC"): Promise<IndicatorsResponse> {
  const res = await fetch(`${API_BASE}/api/indicators?coin=${coin}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch indicators: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAnalysis(coin: string = "BTC", type: "ai" | "algo" | "hybrid" = "ai"): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/analysis?coin=${coin}&type=${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch analysis: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
