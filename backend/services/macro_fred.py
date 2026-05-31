"""Federal Reserve Economic Data (FRED) macro indicators."""

import httpx
import pandas as pd
import numpy as np
import asyncio

from config import settings
from services.technical import _fetch_klines

async def _fetch_fred_series(client: httpx.AsyncClient, series_id: str, limit: int = 2) -> list:
    if not settings.fred_api_key:
        return []
        
    url = f"{settings.fred_base_url}/series/observations"
    params = {
        "series_id": series_id,
        "api_key": settings.fred_api_key,
        "file_type": "json",
        "sort_order": "desc",
        "limit": limit
    }
    try:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        return data.get("observations", [])
    except Exception as e:
        from logger import logger
        logger.warning(f"FRED API error for {series_id}: {e}")
        return []

def _get_trend(obs: list) -> str | None:
    if len(obs) < 2:
        return None
    try:
        current = float(obs[0]["value"])
        previous = float(obs[1]["value"])
        if current > previous:
            return "Rising"
        elif current < previous:
            return "Falling"
        return "Stable"
    except ValueError:
        return None

async def get_fred_macro_data(symbol: str = "BTCUSDT") -> dict:
    """Fetch macro data from FRED and compute correlation."""
    if not settings.fred_api_key:
        return {
            "global_liquidity_m2": None,
            "nfp_trend": None,
            "cpi_trend": None,
            "nasdaq_correlation": None,
        }

    async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
        # Fetch M2SL (M2 Money Supply - Billions of Dollars)
        m2_obs = await _fetch_fred_series(client, "M2SL", 1)
        m2_value = float(m2_obs[0]["value"]) if m2_obs and m2_obs[0]["value"] != "." else None

        await asyncio.sleep(0.5)

        # Fetch PAYEMS (Nonfarm Payrolls)
        nfp_obs = await _fetch_fred_series(client, "PAYEMS", 2)
        nfp_trend = _get_trend(nfp_obs)

        await asyncio.sleep(0.5)

        # Fetch CPIAUCSL (CPI)
        cpi_obs = await _fetch_fred_series(client, "CPIAUCSL", 2)
        cpi_trend = _get_trend(cpi_obs)

        await asyncio.sleep(0.5)

        # Fetch NASDAQ100 (Daily)
        ndx_obs = await _fetch_fred_series(client, "NASDAQ100", 30)
        
        # Calculate correlation with Crypto asset
        correlation = None
        if ndx_obs:
            # Format NDX data
            ndx_df = pd.DataFrame(ndx_obs)
            ndx_df = ndx_df[ndx_df["value"] != "."] # Remove nulls represented as '.' in FRED
            if not ndx_df.empty:
                ndx_df["date"] = pd.to_datetime(ndx_df["date"])
                ndx_df["value"] = ndx_df["value"].astype(float)
                ndx_df = ndx_df.sort_values("date")
                ndx_df.set_index("date", inplace=True)
                
                # Fetch crypto klines (daily)
                crypto_df = await _fetch_klines(symbol, "1d", limit=45) # get a bit more to ensure overlap
                crypto_df["open_time"] = pd.to_datetime(crypto_df["open_time"], unit="ms").dt.normalize()
                crypto_df.set_index("open_time", inplace=True)
                
                # Join and compute correlation of pct changes
                joined = ndx_df[["value"]].join(crypto_df[["close"]], how="inner").dropna()
                if len(joined) > 10:
                    joined["ndx_ret"] = joined["value"].pct_change()
                    joined["crypto_ret"] = joined["close"].pct_change()
                    correlation = joined["ndx_ret"].corr(joined["crypto_ret"])
                    if pd.isna(correlation):
                        correlation = None

    return {
        "global_liquidity_m2": m2_value,
        "nfp_trend": nfp_trend,
        "cpi_trend": cpi_trend,
        "nasdaq_correlation": float(correlation) if correlation is not None else None,
    }
