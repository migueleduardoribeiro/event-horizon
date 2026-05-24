"""GET /api/indicators — Collect all market indicators in parallel."""

import asyncio
import traceback

from fastapi import APIRouter

from services.technical import get_technical_indicators
from services.derivatives import get_derivatives_data
from services.sentiment import get_sentiment_data
from services.macro import get_macro_data
from services.onchain import get_onchain_data
from services.macro_fred import get_fred_macro_data
from logger import logger

router = APIRouter(prefix="/api", tags=["indicators"])


@router.get("/indicators")
async def fetch_indicators(coin: str = "BTC"):
    """Fetch all indicators in parallel. Errors are collected per-service,
    never silenced — the response includes an 'errors' array."""

    coin = coin.upper()
    symbol = f"{coin}USDT"
    errors: list[str] = []

    logger.info(f"Fetching market indicators for {symbol}...")

    # Run all services concurrently, catching per-service failures
    results = await asyncio.gather(
        get_technical_indicators(symbol),
        get_derivatives_data(symbol),
        get_sentiment_data(),
        get_macro_data(),
        get_onchain_data(coin),
        get_fred_macro_data(symbol),
        return_exceptions=True,
    )

    def _unwrap(index: int, name: str, default: dict) -> dict:
        result = results[index]
        if isinstance(result, Exception):
            err_msg = f"[{name}] {type(result).__name__}: {result}"
            logger.error(f"Error fetching {name} indicator: {err_msg}")
            errors.append(err_msg)
            # Return null-valued dict so the frontend knows which fields failed
            return {k: None for k in default}
        return result

    technical = _unwrap(0, "Technical", {
        "price": None, "rsi_1d": None, "rsi_4h": None,
        "macd_histogram_1d": None, "macd_signal_1d": None,
        "sma_50": None, "sma_200": None, "golden_cross": None,
        "bb_upper_1d": None, "bb_lower_1d": None, "bb_position": None,
        "order_book_imbalance": None,
    })
    derivatives = _unwrap(1, "Derivatives", {
        "open_interest": None, "funding_rate": None, "long_short_ratio": None,
        "recent_liquidations_long": None, "recent_liquidations_short": None, "cvd_24h": None,
    })
    sentiment = _unwrap(2, "Sentiment", {
        "fear_greed_index": None, "fear_greed_label": None,
    })
    macro_dxy = _unwrap(3, "Macro_DXY", {
        "dxy_value": None, "dxy_change_pct": None,
    })
    onchain = _unwrap(4, "On-Chain", {
        "hash_rate": None, "difficulty": None, "mempool_count": None,
        "total_supply_btc": None,
    })
    macro_fred = _unwrap(5, "Macro_FRED", {
        "global_liquidity_m2": None, "nfp_trend": None, "cpi_trend": None,
        "nasdaq_correlation": None,
    })

    macro = {**macro_dxy, **macro_fred}

    if errors:
        logger.warning(f"Indicator fetching completed with {len(errors)} errors for {symbol}.")
    else:
        logger.success(f"All indicators fetched successfully for {symbol}.")

    return {
        "technical": technical,
        "derivatives": derivatives,
        "sentiment": sentiment,
        "macro": macro,
        "onchain": onchain,
        "errors": errors,
    }
