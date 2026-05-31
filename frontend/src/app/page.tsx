"use client";

import { useState, useCallback } from "react";
import type { IndicatorsResponse, AnalysisVerdict } from "@/lib/types";
import { fetchIndicators, fetchAnalysis } from "@/lib/api";
import Header from "@/components/Header";
import IndicatorsSidebar from "@/components/IndicatorsSidebar";
import VerdictPanel from "@/components/VerdictPanel";
import FearGreedGauge from "@/components/FearGreedGauge";
import ErrorBadges from "@/components/ErrorBadges";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardPage() {
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [indicators, setIndicators] = useState<IndicatorsResponse | null>(null);
  const [verdict, setVerdict] = useState<AnalysisVerdict | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<"ai" | "algo" | "hybrid" | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoadingIndicators, setIsLoadingIndicators] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  /* ─── Fetch Indicators Only ─────────────────────────────────────── */
  const handleFetchIndicators = useCallback(async () => {
    setIsLoadingIndicators(true);
    setFetchError(null);
    try {
      const data = await fetchIndicators(selectedCoin);
      setIndicators(data);
      setLastUpdated(new Date());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch indicators");
    } finally {
      setIsLoadingIndicators(false);
    }
  }, []);

  /* ─── Run Full Analysis ─────────────────────────────────────────── */
  const handleRunAnalysis = useCallback(async (type: "ai" | "algo" | "hybrid") => {
    setIsLoadingAnalysis(true);
    setFetchError(null);
    setAnalysisError(null);
    setAnalysisType(type);
    try {
      const data = await fetchAnalysis(selectedCoin, type);
      setIndicators(data.indicators);
      setVerdict(data.analysis);
      setAnalysisError(data.analysis_error);
      setLastUpdated(new Date());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to run analysis");
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, []);

  const isLoading = isLoadingIndicators || isLoadingAnalysis;
  const price = indicators?.technical.price ?? null;

  const handleCoinChange = (coin: string) => {
    setSelectedCoin(coin);
    setIndicators(null);
    setVerdict(null);
    setFetchError(null);
    setAnalysisError(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0f]">
      {/* ── Header ────────────────────────────────────────────────── */}
      <Header lastUpdated={lastUpdated} coin={selectedCoin} onCoinChange={handleCoinChange} />

      {/* ── Action Bar ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5">
        <button
          onClick={handleFetchIndicators}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg
                     bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                     text-text-secondary hover:text-white transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoadingIndicators ? (
            <LoadingSpinner size={14} />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh Data
        </button>

        <button
          onClick={() => handleRunAnalysis("ai")}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg
                     bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 hover:border-neon-green/50
                     text-neon-green transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed
                     shadow-[0_0_15px_rgba(0,255,136,0.1)] hover:shadow-[0_0_25px_rgba(0,255,136,0.2)]"
        >
          {isLoadingAnalysis && analysisType === "ai" ? (
            <LoadingSpinner size={14} />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          Run AI Analysis
        </button>

        <button
          onClick={() => handleRunAnalysis("algo")}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg
                     bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50
                     text-blue-400 transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed
                     shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]"
        >
          {isLoadingAnalysis && analysisType === "algo" ? (
            <LoadingSpinner size={14} />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
          Run Algo Analysis
        </button>

        <button
          onClick={() => handleRunAnalysis("hybrid")}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg
                     bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50
                     text-purple-400 transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed
                     shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]"
        >
          {isLoadingAnalysis && analysisType === "hybrid" ? (
            <LoadingSpinner size={14} />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          )}
          Run Hybrid Analysis
        </button>

        {/* Connection error */}
        {fetchError && (
          <span className="ml-auto flex items-center gap-1.5 text-[0.65rem] text-neon-red font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-red animate-pulse" />
            {fetchError}
          </span>
        )}
        {/* Loading text */}
        {isLoadingAnalysis && analysisType === "ai" && !fetchError && (
          <span className="ml-auto flex items-center gap-1.5 text-[0.65rem] text-neon-green/80 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            AI analysis may take up to 5 minutes...
          </span>
        )}
      </div>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {!indicators && !isLoading ? (
          /* ── Welcome / Empty State ─────────────────────────────── */
          <div className="h-full flex flex-col items-center justify-center gap-8 px-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border border-white/[0.06] flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border border-white/[0.04] flex items-center justify-center">
                  <span className="text-4xl opacity-30">
                    {selectedCoin === "BTC" ? "₿" : selectedCoin === "ETH" ? "Ξ" : selectedCoin === "SOL" ? "◎" : "💎"}
                  </span>
                </div>
              </div>
              <div className="absolute inset-0 w-28 h-28 rounded-full border border-neon-green/10 animate-ping opacity-20" />
            </div>
            <div className="text-center max-w-md">
              <h2 className="text-lg font-semibold text-white mb-2">
                {selectedCoin} Confluence Dashboard
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Aggregate 30+ market indicators across technical, derivatives, sentiment,
                macro, and on-chain data — then choose between an AI-powered or deterministic Algorithmic verdict.
              </p>
            </div>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => handleRunAnalysis("ai")}
                className="flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-xl
                           bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 hover:border-neon-green/50
                           text-neon-green transition-all duration-300
                           shadow-[0_0_30px_rgba(0,255,136,0.1)] hover:shadow-[0_0_50px_rgba(0,255,136,0.2)]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Analysis
              </button>
              <button
                onClick={() => handleRunAnalysis("algo")}
                className="flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-xl
                           bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50
                           text-blue-400 transition-all duration-300
                           shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:shadow-[0_0_50px_rgba(59,130,246,0.2)]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Algo Analysis
              </button>
              <button
                onClick={() => handleRunAnalysis("hybrid")}
                className="flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-xl
                           bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50
                           text-purple-400 transition-all duration-300
                           shadow-[0_0_30px_rgba(168,85,247,0.1)] hover:shadow-[0_0_50px_rgba(168,85,247,0.2)]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Hybrid Analysis
              </button>
            </div>
            {isLoadingAnalysis && analysisType === "ai" && (
              <p className="text-[0.7rem] text-neon-green/80 mt-1 font-mono animate-pulse">
                AI analysis may take up to 5 minutes. Please wait...
              </p>
            )}
          </div>
        ) : (
          /* ── Dashboard Grid ────────────────────────────────────── */
          <div className="h-full grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 overflow-hidden">
            {/* Left — Indicators */}
            <div className="border-r border-white/5 p-4 overflow-y-auto">
              {indicators ? (
                <>
                  <IndicatorsSidebar data={indicators} coin={selectedCoin} />
                  {/* Fear & Greed Gauge below indicators */}
                  <div className="mt-4">
                    <FearGreedGauge
                      value={indicators.sentiment.fear_greed_index}
                      label={indicators.sentiment.fear_greed_label}
                    />
                  </div>
                  {/* Error Badges */}
                  {indicators.errors.length > 0 && (
                    <div className="mt-4">
                      <ErrorBadges errors={indicators.errors} />
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <LoadingSpinner size={32} />
                </div>
              )}
            </div>

            {/* Right — Verdict */}
            <div className="p-4 md:p-6 overflow-y-auto flex flex-col">
              <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
                <VerdictPanel
                  verdict={verdict}
                  analysisError={analysisError}
                  isLoading={isLoadingAnalysis}
                  coin={selectedCoin}
                  analysisType={analysisType}
                />
              </div>

              {/* Bottom bar with quick stats when we have data */}
              {indicators && verdict && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 fade-in">
                  <QuickStat
                    label="RSI (1D)"
                    value={indicators.technical.rsi_1d?.toFixed(1) ?? "—"}
                    color={
                      indicators.technical.rsi_1d === null
                        ? "muted"
                        : indicators.technical.rsi_1d < 30
                          ? "green"
                          : indicators.technical.rsi_1d > 70
                            ? "red"
                            : "amber"
                    }
                  />
                  <QuickStat
                    label="Funding"
                    value={
                      indicators.derivatives.funding_rate !== null
                        ? `${indicators.derivatives.funding_rate >= 0 ? "+" : ""}${indicators.derivatives.funding_rate.toFixed(4)}%`
                        : "—"
                    }
                    color={
                      indicators.derivatives.funding_rate === null
                        ? "muted"
                        : indicators.derivatives.funding_rate > 0.01
                          ? "red"
                          : indicators.derivatives.funding_rate < -0.01
                            ? "green"
                            : "amber"
                    }
                  />
                  <QuickStat
                    label="F&G"
                    value={indicators.sentiment.fear_greed_index?.toString() ?? "—"}
                    color={
                      indicators.sentiment.fear_greed_index === null
                        ? "muted"
                        : indicators.sentiment.fear_greed_index <= 25
                          ? "red"
                          : indicators.sentiment.fear_greed_index >= 75
                            ? "green"
                            : "amber"
                    }
                  />
                  <QuickStat
                    label="Golden Cross"
                    value={indicators.technical.golden_cross ? "YES" : "NO"}
                    color={indicators.technical.golden_cross ? "green" : "red"}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="px-6 py-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[0.6rem] text-text-muted font-mono">
          EVENT HORIZON v1.0 — Not financial advice
        </span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
          <span className="text-[0.6rem] text-text-muted font-mono">
            API: localhost:8000
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Quick Stat Mini-Card ────────────────────────────────────────────────── */
function QuickStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "green" | "red" | "amber" | "muted";
}) {
  const colorClasses = {
    green: "text-neon-green border-neon-green/20 bg-neon-green/5",
    red: "text-neon-red border-neon-red/20 bg-neon-red/5",
    amber: "text-neon-amber border-neon-amber/20 bg-neon-amber/5",
    muted: "text-text-muted border-white/5 bg-white/[0.02]",
  };

  return (
    <div className={`rounded-lg border px-3 py-2 ${colorClasses[color]}`}>
      <span className="block text-[0.6rem] uppercase tracking-wider opacity-60 mb-0.5">
        {label}
      </span>
      <span className="font-mono text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}
