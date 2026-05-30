"use client";

interface FearGreedGaugeProps {
  value: number | null;
  label: string | null;
}

export default function FearGreedGauge({ value, label }: FearGreedGaugeProps) {
  if (value === null) {
    return (
      <div className="glass-card p-4 flex flex-col items-center gap-2">
        <span className="section-label">Fear & Greed Index</span>
        <span className="text-text-muted text-sm font-mono">—</span>
      </div>
    );
  }

  const clampedValue = Math.min(100, Math.max(0, value));

  let textColor = "text-neon-amber";
  if (clampedValue <= 25) textColor = "text-neon-red";
  else if (clampedValue >= 75) textColor = "text-neon-green";

  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex justify-between items-baseline">
        <span className="section-label">Fear & Greed Index</span>
        <span className={`text-xs font-semibold ${textColor}`}>{label}</span>
      </div>

      {/* Gauge bar */}
      <div className="relative">
        <div className="w-full h-2 rounded-full fear-greed-bar opacity-30" />
        <div className="w-full h-2 rounded-full fear-greed-bar absolute inset-0 overflow-hidden">
          {/* Mask to show only up to the value */}
          <div
            className="absolute inset-0 bg-[#0a0a0f]"
            style={{ left: `${clampedValue}%` }}
          />
        </div>
        {/* Needle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#0a0a0f] shadow-lg transition-all duration-700"
          style={{ left: `calc(${clampedValue}% - 6px)` }}
        />
      </div>

      {/* Value */}
      <div className="flex justify-between items-baseline">
        <span className="text-[0.6rem] text-text-muted font-mono">0 — Extreme Fear</span>
        <span className={`font-mono text-lg font-bold tabular-nums ${textColor}`}>
          {value}
        </span>
        <span className="text-[0.6rem] text-text-muted font-mono">Extreme Greed — 100</span>
      </div>
    </div>
  );
}
