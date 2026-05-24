"""Derivatives data from Binance Futures public endpoints."""

import httpx

from config import settings
from services.binance_ws import liquidation_tracker

async def get_derivatives_data(symbol: str = "BTCUSDT") -> dict:
    """Fetch Open Interest, Funding Rate, and Long/Short Ratio."""
    async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
        # Open Interest
        oi_resp = await client.get(
            f"{settings.binance_futures_url}/fapi/v1/openInterest",
            params={"symbol": symbol},
        )
        oi_resp.raise_for_status()
        oi_data = oi_resp.json()
        open_interest = round(float(oi_data.get("openInterest", 0)), 2)

        # Funding Rate (latest)
        fr_resp = await client.get(
            f"{settings.binance_futures_url}/fapi/v1/fundingRate",
            params={"symbol": symbol, "limit": 1},
        )
        fr_resp.raise_for_status()
        fr_data = fr_resp.json()
        funding_rate = round(float(fr_data[0]["fundingRate"]), 6) if fr_data else None

        # Long/Short Ratio (latest)
        ls_resp = await client.get(
            f"{settings.binance_futures_url}/futures/data/globalLongShortAccountRatio",
            params={"symbol": symbol, "period": "4h", "limit": 1},
        )
        ls_resp.raise_for_status()
        ls_data = ls_resp.json()
        long_short_ratio = round(float(ls_data[0]["longShortRatio"]), 4) if ls_data else None

        # Recent Liquidations (tracked via WebSocket)
        liq_data = liquidation_tracker.get_all()
        liq_long = sum(x["executedQty"] * x["averagePrice"] for x in liq_data if x["side"] == "SELL")
        liq_short = sum(x["executedQty"] * x["averagePrice"] for x in liq_data if x["side"] == "BUY")

        # Cumulative Volume Delta (CVD) - 24h using 1h klines
        klines_resp = await client.get(
            f"{settings.binance_futures_url}/fapi/v1/klines",
            params={"symbol": symbol, "interval": "1h", "limit": 24},
        )
        klines_resp.raise_for_status()
        klines_data = klines_resp.json()
        cvd_24h = 0.0
        for k in klines_data:
            total_vol = float(k[7]) # quote asset volume
            buy_vol = float(k[10]) # taker buy quote asset volume
            sell_vol = total_vol - buy_vol
            cvd_24h += (buy_vol - sell_vol)

    return {
        "open_interest": open_interest,
        "funding_rate": funding_rate,
        "long_short_ratio": long_short_ratio,
        "recent_liquidations_long": liq_long,
        "recent_liquidations_short": liq_short,
        "cvd_24h": cvd_24h,
    }
