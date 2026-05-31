"""Deterministic algorithmic analysis based on indicator values."""

from logger import logger

def generate_trade_setup(tech: dict, tipo: str) -> dict:
    current_price = tech.get("price") or 0.0
    entrada = f"${current_price:,.2f}"
    alvos = []
    stop_loss = ""
    risco_recompensa = "N/A"
    
    sma_50 = tech.get("sma_50")
    bb_upper = tech.get("bb_upper_1d")
    bb_lower = tech.get("bb_lower_1d")

    if tipo == "LONG" and current_price > 0:
        # Dynamic Take profit: BB upper, or fallback +5%
        tp1 = bb_upper if (bb_upper and bb_upper > current_price) else current_price * 1.05
        tp2 = tp1 * 1.05 # Extend TP2
        alvos = [f"${tp1:,.2f}", f"${tp2:,.2f}"]

        # Dynamic Stop Loss: SMA 50 or BB lower, or fallback -4%
        possible_stops = [v for v in [sma_50, bb_lower] if v and v < current_price]
        sl = max(possible_stops) if possible_stops else current_price * 0.96
        sl = sl * 0.99  # Add tiny buffer
        stop_loss = f"${sl:,.2f}"

        # Calculate approximate R:R
        risk = current_price - sl
        reward = tp1 - current_price
        if risk > 0:
            risco_recompensa = f"1:{round(reward/risk, 1)}"

    elif tipo == "SHORT" and current_price > 0:
        # Dynamic Take profit: BB lower, or fallback -5%
        tp1 = bb_lower if (bb_lower and bb_lower < current_price) else current_price * 0.95
        tp2 = tp1 * 0.95
        alvos = [f"${tp1:,.2f}", f"${tp2:,.2f}"]

        # Dynamic Stop Loss: SMA 50 or BB upper, or fallback +4%
        possible_stops = [v for v in [sma_50, bb_upper] if v and v > current_price]
        sl = min(possible_stops) if possible_stops else current_price * 1.04
        sl = sl * 1.01  # Add tiny buffer
        stop_loss = f"${sl:,.2f}"
        
        # Calculate approximate R:R
        risk = sl - current_price
        reward = current_price - tp1
        if risk > 0:
            risco_recompensa = f"1:{round(reward/risk, 1)}"
    else:
        entrada = "N/A"
        stop_loss = "N/A"
        alvos = ["N/A"]
        
    return {
        "tipo": tipo,
        "entrada": entrada,
        "alvos_lucro": alvos,
        "stop_loss": stop_loss,
        "risco_recompensa": risco_recompensa
    }

def generate_algo_analysis(indicators: dict) -> dict:
    """Generates a quantitative trading analysis based purely on technical/on-chain metrics."""
    logger.info("Starting deterministic algorithmic analysis...")
    tech = indicators.get("technical", {})
    deriv = indicators.get("derivatives", {})
    sent = indicators.get("sentiment", {})
    macro = indicators.get("macro", {})
    onchain = indicators.get("onchain", {})

    current_price = tech.get("price") or 0.0

    # Evaluate Technicals
    tech_score = 0
    if tech.get("rsi_1d"):
        if tech["rsi_1d"] < 35: tech_score += 15
        elif tech["rsi_1d"] > 65: tech_score -= 15
    
    macd = tech.get("macd_signal_1d", "").upper()
    if macd == "BULLISH": tech_score += 10
    elif macd == "BEARISH": tech_score -= 10

    golden = tech.get("golden_cross")
    if golden is True: 
        tech_score += 15
    elif golden is False: 
        tech_score -= 15  # Death cross penalty

    # Order Book Imbalance
    if tech.get("order_book_imbalance"):
        if tech["order_book_imbalance"] > 1.2: tech_score += 10
        elif tech["order_book_imbalance"] < 0.8: tech_score -= 10

    # Structural Trend (Price vs SMA)
    sma_50 = tech.get("sma_50")
    sma_200 = tech.get("sma_200")
    if current_price > 0 and sma_50 and sma_200:
        if current_price > sma_50 and sma_50 > sma_200:
            tech_score += 15  # Full uptrend structure
        elif current_price < sma_50 and sma_50 < sma_200:
            tech_score -= 15  # Full downtrend structure

    # Evaluate Derivatives
    deriv_score = 0
    if deriv.get("funding_rate") is not None:
        fr = deriv["funding_rate"]
        if fr < 0: deriv_score += 15
        elif 0 <= fr <= 0.005: deriv_score += 5  # Healthy neutral
        elif fr > 0.01: deriv_score -= 15
    
    if deriv.get("long_short_ratio"):
        lsr = deriv["long_short_ratio"]
        if lsr < 1: deriv_score += 10
        elif lsr > 2: deriv_score -= 10

    if deriv.get("cvd_24h"):
        if deriv["cvd_24h"] > 0: deriv_score += 10
        elif deriv["cvd_24h"] < 0: deriv_score -= 10

    # Evaluate Sentiment
    sent_score = 0
    fgi = sent.get("fear_greed_index")
    if fgi is not None:
        if fgi < 30: sent_score += 15
        elif fgi > 75: sent_score -= 15

    # Evaluate Macro
    macro_score = 0
    if macro.get("dxy_change_pct"):
        if macro["dxy_change_pct"] < 0: macro_score += 10
        else: macro_score -= 10
        
    # Evaluate Onchain (Only for BTC or if present and not 0)
    onchain_score = 0
    hash_rate = onchain.get("hash_rate")
    has_onchain = False
    if hash_rate and hash_rate > 0:
        has_onchain = True
        onchain_score += 10

    # Calculate total and normalize
    logger.info(f"Evaluated Technicals (Score: {tech_score})")
    logger.info(f"Evaluated Derivatives (Score: {deriv_score})")
    logger.info(f"Evaluated Sentiment (Score: {sent_score})")
    logger.info(f"Evaluated Macro (Score: {macro_score})")
    if has_onchain:
        logger.info(f"Evaluated Onchain (Score: {onchain_score})")

    total_score_raw = tech_score + deriv_score + sent_score + macro_score + onchain_score
    
    max_range = 135 if has_onchain else 125
    normalized = int(((total_score_raw + max_range) / (max_range * 2)) * 100)
    forca_tendencia = max(0, min(100, normalized))

    if forca_tendencia >= 55:
        sentimento = "Bullish"
        veredito = "COMPRAR"
        tipo = "LONG"
    elif forca_tendencia <= 45:
        sentimento = "Bearish"
        veredito = "VENDER"
        tipo = "SHORT"
    else:
        sentimento = "Neutro"
        veredito = "HOLD"
        tipo = "NEUTRO"

    justificativa = (
        f"Análise quantitativa dinâmica (v2.0).\n"
        f"• Score Técnico: {tech_score}\n"
        f"• Score Derivativos: {deriv_score}\n"
        f"• Score Sentimento: {sent_score}\n"
        f"• Score Macro: {macro_score}\n"
    )
    if has_onchain:
        justificativa += f"• Score Onchain: {onchain_score}\n"
        
    justificativa += (
        f"Força de tendência unificada: {forca_tendencia}%. "
        f"Stops e Alvos ajustados por Médias Móveis e Volatilidade (Bollinger Bands)."
    )

    logger.success(f"Algorithmic analysis completed. Verdict: {veredito} (Strength: {forca_tendencia}%)")

    return {
        "sentimento_mercado": sentimento,
        "forca_tendencia": forca_tendencia,
        "veredito": veredito,
        "justificativa_analitica": justificativa,
        "cenario_atual": "",
        "eventos_mercado": [],
        "previsao_30d": [],
        "sinais_trading": generate_trade_setup(tech, tipo)
    }
