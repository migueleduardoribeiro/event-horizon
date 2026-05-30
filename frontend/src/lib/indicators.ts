import type {
  IndicatorsResponse,
  IndicatorDisplayItem,
  SignalColor,
} from "./types";

// ─── Formatting Helpers ──────────────────────────────────────────────────────

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCompact(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  if (Math.abs(v) >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
}

function fmtPct(v: number | null | undefined, decimals = 4): string {
  if (v === null || v === undefined) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(decimals)}%`;
}

function fmtUsd(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Signal Logic ────────────────────────────────────────────────────────────

function rsiSignal(v: number | null): SignalColor {
  if (v === null) return "inactive";
  if (v < 30) return "bullish";   // oversold = buying opportunity
  if (v > 70) return "bearish";   // overbought
  return "neutral";
}

function macdSignal(sig: string): SignalColor {
  const s = sig.toLowerCase();
  if (s.includes("bullish")) return "bullish";
  if (s.includes("bearish")) return "bearish";
  return "neutral";
}

function bbSignal(pos: string): SignalColor {
  const p = pos.toLowerCase();
  if (p.includes("lower") || p.includes("below")) return "bullish";
  if (p.includes("upper") || p.includes("above")) return "bearish";
  return "neutral";
}

function fundingSignal(v: number | null): SignalColor {
  if (v === null) return "inactive";
  if (v > 0.01) return "bearish";   // overheated longs
  if (v < -0.01) return "bullish";
  return "neutral";
}

function fearGreedSignal(v: number | null): SignalColor {
  if (v === null) return "inactive";
  if (v <= 25) return "bullish";   // extreme fear = buy signal
  if (v >= 75) return "bearish";   // extreme greed = sell signal
  return "neutral";
}

function dxySignal(change: number | null): SignalColor {
  if (change === null) return "inactive";
  if (change > 0.3) return "bearish";   // strong dollar bearish for BTC
  if (change < -0.3) return "bullish";
  return "neutral";
}

function imbalanceSignal(v: number | null): SignalColor {
  if (v === null) return "inactive";
  if (v > 1.1) return "bullish";
  if (v < 0.9) return "bearish";
  return "neutral";
}

function cvdSignal(v: number | null): SignalColor {
  if (v === null) return "inactive";
  if (v > 0) return "bullish";
  if (v < 0) return "bearish";
  return "neutral";
}

function liquidationsSignal(longs: number | null, shorts: number | null): SignalColor {
  if (longs === null || shorts === null) return "inactive";
  if (shorts > longs * 1.5) return "bullish"; // Short squeeze
  if (longs > shorts * 1.5) return "bearish"; // Long squeeze
  return "neutral";
}

function trendSignal(t: string | null, inverse: boolean = false): SignalColor {
  if (!t) return "inactive";
  if (t === "Rising") return inverse ? "bearish" : "bullish";
  if (t === "Falling") return inverse ? "bullish" : "bearish";
  return "neutral";
}

// ─── Transform Indicators → Display Items ────────────────────────────────────

export function buildTechnicalItems(d: IndicatorsResponse, coin: string = "BTC"): IndicatorDisplayItem[] {
  const t = d.technical;
  return [
    {
      name: `${coin} Price`,
      value: fmtUsd(t.price),
      signal: "neutral" as SignalColor,
      tooltip: `Current ${coin} spot price`,
    },
    {
      name: "RSI (1D)",
      value: t.rsi_1d !== null ? t.rsi_1d.toFixed(1) : "—",
      signal: rsiSignal(t.rsi_1d),
      tooltip: "Relative Strength Index — 14-period daily",
    },
    {
      name: "RSI (4H)",
      value: t.rsi_4h !== null ? t.rsi_4h.toFixed(1) : "—",
      signal: rsiSignal(t.rsi_4h),
      tooltip: "Relative Strength Index — 14-period 4h",
    },
    {
      name: "MACD Hist (1D)",
      value: fmt(t.macd_histogram_1d, 2),
      signal: macdSignal(t.macd_signal_1d),
      tooltip: `Signal: ${t.macd_signal_1d}`,
    },
    {
      name: "SMA 50",
      value: fmtUsd(t.sma_50),
      signal: t.sma_50 !== null && t.price > t.sma_50 ? "bullish" : t.sma_50 !== null ? "bearish" : "inactive",
      tooltip: "50-day Simple Moving Average",
    },
    {
      name: "SMA 200",
      value: fmtUsd(t.sma_200),
      signal: t.sma_200 !== null && t.price > t.sma_200 ? "bullish" : t.sma_200 !== null ? "bearish" : "inactive",
      tooltip: "200-day Simple Moving Average",
    },
    {
      name: "Golden Cross",
      value: t.golden_cross ? "YES" : "NO",
      signal: t.golden_cross ? "bullish" : "bearish",
      tooltip: "SMA 50 > SMA 200",
    },
    {
      name: "Bollinger",
      value: t.bb_position,
      signal: bbSignal(t.bb_position),
      tooltip: `Upper: ${fmtUsd(t.bb_upper_1d)} | Lower: ${fmtUsd(t.bb_lower_1d)}`,
    },
    {
      name: "OB Imbalance",
      value: t.order_book_imbalance !== null ? t.order_book_imbalance.toFixed(2) : "—",
      signal: imbalanceSignal(t.order_book_imbalance),
      tooltip: "Bids / Asks ratio within 2% of price",
    },
  ];
}

export function buildDerivativesItems(d: IndicatorsResponse): IndicatorDisplayItem[] {
  const deriv = d.derivatives;
  return [
    {
      name: "Open Interest",
      value: deriv.open_interest !== null ? `$${fmtCompact(deriv.open_interest)}` : "—",
      signal: "neutral" as SignalColor,
      tooltip: "Total open derivative contracts (USD)",
    },
    {
      name: "Funding Rate",
      value: deriv.funding_rate !== null ? fmtPct(deriv.funding_rate) : "—",
      signal: fundingSignal(deriv.funding_rate),
      tooltip: "Perpetual swap funding rate",
    },
    {
      name: "Long/Short Ratio",
      value: deriv.long_short_ratio !== null ? deriv.long_short_ratio.toFixed(2) : "—",
      signal:
        deriv.long_short_ratio === null
          ? "inactive"
          : deriv.long_short_ratio > 1.5
            ? "bearish"
            : deriv.long_short_ratio < 0.7
              ? "bullish"
              : "neutral",
      tooltip: "Ratio of long vs short positions",
    },
    {
      name: "CVD (24h)",
      value: deriv.cvd_24h !== null ? fmtCompact(deriv.cvd_24h) : "—",
      signal: cvdSignal(deriv.cvd_24h),
      tooltip: "Cumulative Volume Delta (Taker Buy vs Sell)",
    },
    {
      name: "Liquidations",
      value: deriv.recent_liquidations_long !== null && deriv.recent_liquidations_short !== null
        ? `L: ${fmtCompact(deriv.recent_liquidations_long)} | S: ${fmtCompact(deriv.recent_liquidations_short)}`
        : "—",
      signal: liquidationsSignal(deriv.recent_liquidations_long, deriv.recent_liquidations_short),
      tooltip: "Recent Force Orders (Longs vs Shorts)",
    },
  ];
}

export function buildSentimentItems(d: IndicatorsResponse): IndicatorDisplayItem[] {
  const s = d.sentiment;
  return [
    {
      name: "Fear & Greed",
      value: s.fear_greed_index !== null ? `${s.fear_greed_index}` : "—",
      signal: fearGreedSignal(s.fear_greed_index),
      tooltip: s.fear_greed_label || "Crypto Fear & Greed Index",
    },
  ];
}

export function buildMacroItems(d: IndicatorsResponse): IndicatorDisplayItem[] {
  const m = d.macro;
  return [
    {
      name: "DXY",
      value: m.dxy_value !== null ? m.dxy_value.toFixed(2) : "—",
      signal: dxySignal(m.dxy_change_pct),
      tooltip: m.dxy_change_pct !== null ? `Change: ${fmtPct(m.dxy_change_pct, 2)}` : "US Dollar Index",
    },
    {
      name: "M2 Liquidity",
      value: m.global_liquidity_m2 !== null ? `$${fmtCompact(m.global_liquidity_m2 * 1e9)}` : "—",
      signal: "neutral" as SignalColor,
      tooltip: "US M2 Money Supply (FRED)",
    },
    {
      name: "NFP Trend",
      value: m.nfp_trend || "—",
      signal: trendSignal(m.nfp_trend, true), // Hot job market = hawkish = bearish crypto
      tooltip: "Nonfarm Payrolls Trend",
    },
    {
      name: "CPI Trend",
      value: m.cpi_trend || "—",
      signal: trendSignal(m.cpi_trend, true), // Rising inflation = hawkish = bearish crypto
      tooltip: "Consumer Price Index Trend",
    },
    {
      name: "NDX Correlation",
      value: m.nasdaq_correlation !== null ? m.nasdaq_correlation.toFixed(2) : "—",
      signal: m.nasdaq_correlation !== null && m.nasdaq_correlation > 0.7 ? "bullish" : "neutral",
      tooltip: "30-day Pearson correlation with NASDAQ 100",
    },
  ];
}

export function buildOnchainItems(d: IndicatorsResponse, coin: string = "BTC"): IndicatorDisplayItem[] {
  const o = d.onchain;
  return [
    {
      name: "Hash Rate",
      value: o.hash_rate !== null ? fmtCompact(o.hash_rate) + " H/s" : "—",
      signal: o.hash_rate !== null ? "bullish" : "inactive",
      tooltip: "Network hash rate (higher = more secure)",
    },
    {
      name: "Difficulty",
      value: o.difficulty !== null ? fmtCompact(o.difficulty) : "—",
      signal: "neutral" as SignalColor,
      tooltip: "Mining difficulty",
    },
    {
      name: "Mempool",
      value: o.mempool_count !== null ? fmtCompact(o.mempool_count) + " txns" : "—",
      signal:
        o.mempool_count === null
          ? "inactive"
          : o.mempool_count > 100000
            ? "bearish"
            : "neutral",
      tooltip: "Unconfirmed transactions",
    },
    {
      name: "Total Supply",
      value: o.total_supply_btc !== null ? fmtCompact(o.total_supply_btc) + ` ${coin}` : "—",
      signal:
        o.total_supply_btc === null ? "inactive" : "neutral",
      tooltip: `Total ${coin} in circulation`,
    },
  ];
}
