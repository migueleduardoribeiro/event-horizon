// ─── API Response Types ──────────────────────────────────────────────────────

export interface TechnicalIndicators {
  price: number;
  rsi_1d: number | null;
  rsi_4h: number | null;
  macd_histogram_1d: number | null;
  macd_signal_1d: string;
  sma_50: number | null;
  sma_200: number | null;
  golden_cross: boolean;
  bb_upper_1d: number | null;
  bb_lower_1d: number | null;
  bb_position: string;
  order_book_imbalance: number | null;
}

export interface DerivativesIndicators {
  open_interest: number | null;
  funding_rate: number | null;
  long_short_ratio: number | null;
  recent_liquidations_long: number | null;
  recent_liquidations_short: number | null;
  cvd_24h: number | null;
}

export interface SentimentIndicators {
  fear_greed_index: number | null;
  fear_greed_label: string | null;
}

export interface MacroIndicators {
  dxy_value: number | null;
  dxy_change_pct: number | null;
  global_liquidity_m2: number | null;
  nfp_trend: string | null;
  cpi_trend: string | null;
  nasdaq_correlation: number | null;
}

export interface OnchainIndicators {
  hash_rate: number | null;
  difficulty: number | null;
  mempool_count: number | null;
  total_supply_btc: number | null;
}

export interface IndicatorsResponse {
  technical: TechnicalIndicators;
  derivatives: DerivativesIndicators;
  sentiment: SentimentIndicators;
  macro: MacroIndicators;
  onchain: OnchainIndicators;
  errors: string[];
}

export interface MarketEvent {
  evento: string;
  importancia: "Alta" | "Média" | "Baixa";
  impacto_descricao: string;
}

export interface ForecastPoint {
  dia: number;
  preco: number;
}

export interface TradingSignal {
  tipo: "LONG" | "SHORT" | "NEUTRO";
  entrada: string;
  alvos_lucro: string[];
  stop_loss: string;
  risco_recompensa: string;
}

export interface AnalysisVerdict {
  sentimento_mercado: "Bullish" | "Bearish" | "Neutro";
  forca_tendencia: number;
  veredito: "COMPRAR" | "VENDER" | "HOLD";
  justificativa_analitica: string;
  cenario_atual: string;
  eventos_mercado: MarketEvent[];
  previsao_30d: ForecastPoint[];
  sinais_trading: TradingSignal;
}

export interface AnalysisResponse {
  indicators: IndicatorsResponse;
  analysis: AnalysisVerdict | null;
  analysis_error: string | null;
  type?: string;
}

// ─── UI Helper Types ─────────────────────────────────────────────────────────

export type SignalColor = "bullish" | "bearish" | "neutral" | "inactive";

export interface IndicatorDisplayItem {
  name: string;
  value: string;
  signal: SignalColor;
  tooltip?: string;
}
