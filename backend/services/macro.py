"""DXY (US Dollar Index) from Yahoo Finance."""

import asyncio
from functools import partial

import yfinance as yf


def _fetch_dxy_sync() -> dict:
    """Synchronous fetch — run in executor for async compatibility."""
    ticker = yf.Ticker("DX-Y.NYB")
    hist = ticker.history(period="5d")

    if hist.empty:
        raise RuntimeError("No DXY data returned from Yahoo Finance")

    current = round(float(hist["Close"].iloc[-1]), 3)

    # Calculate daily change %
    if len(hist) >= 2:
        prev = float(hist["Close"].iloc[-2])
        change_pct = round(((current - prev) / prev) * 100, 3)
    else:
        change_pct = 0.0

    return {
        "dxy_value": current,
        "dxy_change_pct": change_pct,
    }


async def get_macro_data() -> dict:
    """Fetch DXY data asynchronously by running yfinance in a thread executor."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _fetch_dxy_sync)
