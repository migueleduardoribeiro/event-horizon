"use client";

import { useRef, useState } from "react";
import type { AnalysisVerdict } from "@/lib/types";
import { Share2, Download, Copy, Check } from "lucide-react";
import { toBlob } from "html-to-image";
import MacroEventsList from "./MacroEventsList";
import ForecastChart from "./ForecastChart";

interface VerdictPanelProps {
  verdict: AnalysisVerdict | null;
  analysisError: string | null;
  isLoading: boolean;
  coin?: string;
  analysisType?: "ai" | "algo" | "hybrid" | null;
}

function getVerdictGlowClass(v: string): string {
  switch (v) {
    case "COMPRAR": return "verdict-glow-comprar";
    case "VENDER": return "verdict-glow-vender";
    case "HOLD":
    default: return "verdict-glow-hold";
  }
}

function getVerdictColor(v: string): string {
  switch (v) {
    case "COMPRAR": return "text-neon-green";
    case "VENDER": return "text-neon-red";
    case "HOLD":
    default: return "text-neon-amber";
  }
}

function getSentimentColor(s: string): string {
  const sl = s.toLowerCase();
  if (sl.includes("bullish")) return "text-neon-green";
  if (sl.includes("bearish")) return "text-neon-red";
  return "text-neon-amber";
}

function TrendBar({ value }: { value: number }) {
  const clampedValue = Math.min(100, Math.max(0, value));

  let barColor: string;
  if (clampedValue >= 65) barColor = "bg-neon-green";
  else if (clampedValue <= 35) barColor = "bg-neon-red";
  else barColor = "bg-neon-amber";

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[0.65rem] text-text-muted uppercase tracking-wider">
          Trend Strength
        </span>
        <span className="font-mono text-sm font-bold text-white tabular-nums">
          {clampedValue}%
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

export default function VerdictPanel({
  verdict,
  analysisError,
  isLoading,
  coin = "BTC",
  analysisType = "ai",
}: VerdictPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!panelRef.current) return;
    try {
      const blob = await toBlob(panelRef.current, { 
        backgroundColor: "#0a0a0f", 
        cacheBust: true,
        fontEmbedCSS: "" // Bypasses the document.styleSheets CSS rule parsing to prevent CORS errors
      });
      if (!blob) return;
      
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000); // Exibe o toast por 3 segundos
      } else {
        alert("Your browser doesn't support direct image copying.");
      }
    } catch (error) {
      console.error("Failed to copy image", error);
    }
  };

  const handleShare = async () => {
    if (!panelRef.current) return;
    try {
      const blob = await toBlob(panelRef.current, { 
        backgroundColor: "#0a0a0f", 
        cacheBust: true,
        fontEmbedCSS: "" // Bypasses the document.styleSheets CSS rule parsing to prevent CORS errors
      });
      if (!blob) return;
      const file = new File([blob], "bitcoin-analysis.png", { type: "image/png" });
      // Try Web Share API (mobile devices primarily)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `${coin} Analysis - Event Horizon`,
            text: `See my latest ${analysisType === 'algo' ? 'algorithmic' : analysisType === 'hybrid' ? 'hybrid' : 'AI-generated'} confluence analysis for ${coin}.`,
            files: [file],
          });
          return;
        } catch (e) {
          console.log("Share cancelled or failed", e);
        }
      }
      // Fallback to Download on desktop
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bitcoin-analysis.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to share image", error);
    }
  };

  /* ─── Loading State ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <div className="relative">
          <span className="spinner block w-12 h-12" />
          <span
            className="spinner absolute inset-0 block w-12 h-12 opacity-30"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
        </div>
        <div className="text-center">
          <p className="text-sm text-text-secondary">Analyzing market confluence…</p>
          <p className="text-sm font-mono text-neon-green/80 mt-4 animate-pulse">
            {analysisType === "algo" 
              ? `Processing quantitative algorithmic analysis for ${coin}...`
              : analysisType === "hybrid"
              ? `Processing hybrid analysis (Algo + AI) for ${coin}...`
              : `Fetching indicators + geopolitical scenario for ${coin} (Gemini AI)`}
          </p>
        </div>
      </div>
    );
  }

  /* ─── Error State ───────────────────────────────────────────────── */
  if (analysisError) {
    return (
      <div className="glass-card glow-red rounded-2xl p-8 flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
          <span className="text-2xl">⚠</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-neon-red">Analysis Error</p>
          <p className="text-xs text-text-secondary mt-2 max-w-sm">{analysisError}</p>
        </div>
      </div>
    );
  }

  /* ─── Empty State (no analysis yet) ─────────────────────────────── */
  if (!verdict) {
    return (
      <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center gap-6 min-h-[400px]">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center">
            <span className="text-3xl opacity-40">
              {coin === "BTC" ? "₿" : coin === "ETH" ? "Ξ" : coin === "SOL" ? "◎" : "💎"}
            </span>
          </div>
          <div className="absolute inset-0 w-20 h-20 rounded-full border border-white/5 animate-ping opacity-20" />
        </div>
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Click <span className="text-white font-medium">&quot;Run Analysis&quot;</span> to generate
          </p>
          <p className="text-[0.6rem] text-text-muted mt-1">
            {analysisType === "algo" ? "Algorithmic verdict across quantitative metrics" : analysisType === "hybrid" ? "Hybrid analysis combining Algo + AI scoring" : "AI verdict across 30+ indicators + macro scenarios"}
          </p>
        </div>
      </div>
    );
  }

  /* ─── Verdict Display ──────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-4 relative">
      {/* ── Toast Notification ── */}
      {copied && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-neon-green/10 border border-neon-green/30 px-4 py-3 rounded-lg shadow-[0_0_20px_rgba(0,255,136,0.2)] fade-in">
          <div className="w-6 h-6 rounded-full bg-neon-green/20 flex items-center justify-center">
            <Check size={14} className="text-neon-green" />
          </div>
          <span className="text-neon-green text-sm font-semibold">Image copied to Clipboard!</span>
        </div>
      )}

      {/* Action Bar (Share / Copy) */}
      <div className="flex justify-end gap-2 fade-in">
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            copied
              ? "bg-neon-green/20 border-neon-green/50 text-neon-green"
              : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Image"}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
        >
          <Share2 size={14} />
          Share
        </button>
      </div>

      {/* The Printable Area */}
      <div
        ref={panelRef}
        className={`glass-card rounded-2xl p-6 md:p-8 flex flex-col gap-6 fade-in ${getVerdictGlowClass(verdict.veredito)}`}
      >
        {/* ── Top: Verdict + Sentiment ────────────────────────────── */}
        <div className="flex flex-col items-center text-center gap-3">
          <span className="section-label">{analysisType === "algo" ? "Algorithmic Verdict" : analysisType === "hybrid" ? "Hybrid Verdict" : "AI Verdict"}</span>
          <h2 className={`text-4xl md:text-5xl font-black tracking-tight font-mono ${getVerdictColor(verdict.veredito)}`}>
            {verdict.veredito === "COMPRAR" ? "BUY" : verdict.veredito === "VENDER" ? "SELL" : verdict.veredito}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-text-muted">Sentiment:</span>
            <span className={`text-sm font-semibold ${getSentimentColor(verdict.sentimento_mercado)}`}>
              {verdict.sentimento_mercado === "Neutro" ? "Neutral" : verdict.sentimento_mercado}
            </span>
          </div>
        </div>

        {/* ── Trend Strength Bar ──────────────────────────────────── */}
        <TrendBar value={verdict.forca_tendencia} />

        {/* ── Justification ──────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className="section-label">Analytical Justification</span>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {verdict.justificativa_analitica}
          </p>
        </div>

        {/* ── Trading Setup ──────────────────────────────────────── */}
        {verdict.sinais_trading && (
          <div className="flex flex-col gap-3 p-4 rounded-xl border border-white/10 bg-black/20">
            <div className="flex items-center justify-between">
              <span className="text-[0.75rem] font-bold text-text-muted uppercase tracking-wider mb-0">Trading Setup</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                verdict.sinais_trading.tipo === "LONG" ? "bg-neon-green/20 text-neon-green border border-neon-green/30" : 
                verdict.sinais_trading.tipo === "SHORT" ? "bg-neon-red/20 text-neon-red border border-neon-red/30" : 
                "bg-neon-amber/20 text-neon-amber border border-neon-amber/30"
              }`}>
                {verdict.sinais_trading.tipo}
              </span>
            </div>
            
            {verdict.sinais_trading.tipo !== "NEUTRO" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.65rem] text-text-muted uppercase">Entry</span>
                    <span className="text-sm text-white font-mono">{verdict.sinais_trading.entrada}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.65rem] text-text-muted uppercase">Stop Loss</span>
                    <span className="text-sm text-neon-red font-mono">{verdict.sinais_trading.stop_loss}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[0.65rem] text-text-muted uppercase">Take Profit Targets</span>
                  <div className="flex flex-wrap gap-2">
                    {verdict.sinais_trading.alvos_lucro?.map((alvo, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs bg-neon-green/10 text-neon-green rounded-md font-mono border border-neon-green/20">
                        {alvo}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1 pt-2 border-t border-white/5">
                  <span className="text-[0.65rem] text-text-muted uppercase">Risk/Reward:</span>
                  <span className="text-xs text-white font-mono">{verdict.sinais_trading.risco_recompensa}</span>
                </div>
              </>
            ) : (
               <p className="text-xs text-text-muted italic">No clear trade setup at the moment. Wait for better confluence.</p>
            )}
          </div>
        )}

        {/* ── Macro Scenario ─────────────────────────────────────── */}
        {verdict.cenario_atual && (
          <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
            <span className="section-label">Macro and Crypto Outlook</span>
            <p className="text-xs text-text-muted leading-relaxed italic border-l-2 border-white/20 pl-3">
              "{verdict.cenario_atual}"
            </p>
          </div>
        )}

        {/* ── Macro Events Cards ─────────────────────────────────── */}
        {verdict.eventos_mercado && verdict.eventos_mercado.length > 0 && (
          <MacroEventsList events={verdict.eventos_mercado} />
        )}

        {/* ── Forecast Chart ─────────────────────────────────────── */}
        {analysisType !== "hybrid" && verdict.previsao_30d && verdict.previsao_30d.length > 0 && (
          <ForecastChart data={verdict.previsao_30d} />
        )}
      </div>
    </div>
  );
}
