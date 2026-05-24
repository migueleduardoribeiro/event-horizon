"""Technical indicators from Binance klines using the 'ta' library."""

import httpx
import pandas as pd
import ta as ta_lib

from config import settings

async def _fetch_klines(symbol: str, interval: str, limit: int = 250) -> pd.DataFrame:
    """Fetch candlestick data from Binance public API."""
    url = f"{settings.binance_base_url}/api/v3/klines"
    params = {"symbol": symbol, "interval": interval, "limit": limit}

    async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    df = pd.DataFrame(
        data,
        columns=[
            "open_time", "open", "high", "low", "close", "volume",
            "close_time", "quote_asset_volume", "number_of_trades",
            "taker_buy_base_asset_volume", "taker_buy_quote_asset_volume", "ignore"
        ]
    )
    df["close"] = df["close"].astype(float)
    return df

async def _fetch_depth(symbol: str, limit: int = 1000) -> dict:
    url = f"{settings.binance_base_url}/api/v3/depth"
    params = {"symbol": symbol, "limit": limit}
    async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()

def _compute_indicators(df: pd.DataFrame) -> dict:
    """Compute RSI, MACD, SMA 50/200, Bollinger Bands from a kline DataFrame."""
    close = df["close"]
    high = df["high"]
    low = df["low"]

    # RSI 14
    rsi_indicator = ta_lib.momentum.RSIIndicator(close=close, window=14)
    rsi_series = rsi_indicator.rsi()
    rsi_val = round(float(rsi_series.iloc[-1]), 2) if not rsi_series.empty and pd.notna(rsi_series.iloc[-1]) else None

    # MACD (12, 26, 9)
    macd_indicator = ta_lib.trend.MACD(close=close, window_slow=26, window_fast=12, window_sign=9)
    macd_hist_series = macd_indicator.macd_diff()
    macd_hist = None
    macd_signal_label = "Neutro"
    if not macd_hist_series.empty and pd.notna(macd_hist_series.iloc[-1]):
        macd_hist = round(float(macd_hist_series.iloc[-1]), 2)
        macd_signal_label = "Bullish" if macd_hist > 0 else "Bearish" if macd_hist < 0 else "Neutro"

    # SMA 50 / 200
    sma50_series = ta_lib.trend.SMAIndicator(close=close, window=50).sma_indicator()
    sma200_series = ta_lib.trend.SMAIndicator(close=close, window=200).sma_indicator()
    sma50_val = round(float(sma50_series.iloc[-1]), 2) if not sma50_series.empty and pd.notna(sma50_series.iloc[-1]) else None
    sma200_val = round(float(sma200_series.iloc[-1]), 2) if not sma200_series.empty and pd.notna(sma200_series.iloc[-1]) else None

    golden_cross = (sma50_val > sma200_val) if sma50_val and sma200_val else False

    # Bollinger Bands (20, 2)
    bb_indicator = ta_lib.volatility.BollingerBands(close=close, window=20, window_dev=2)
    bb_upper_series = bb_indicator.bollinger_hband()
    bb_lower_series = bb_indicator.bollinger_lband()

    bb_upper = None
    bb_lower = None
    bb_position = "Neutro"
    if not bb_upper_series.empty and pd.notna(bb_upper_series.iloc[-1]):
        bb_upper = round(float(bb_upper_series.iloc[-1]), 2)
    if not bb_lower_series.empty and pd.notna(bb_lower_series.iloc[-1]):
        bb_lower = round(float(bb_lower_series.iloc[-1]), 2)

    current_price = float(close.iloc[-1])
    if bb_upper and bb_lower:
        if current_price >= bb_upper:
            bb_position = "Overbought"
        elif current_price <= bb_lower:
            bb_position = "Oversold"
        else:
            band_range = bb_upper - bb_lower
            if band_range > 0:
                pct = (current_price - bb_lower) / band_range
                bb_position = "Upper" if pct > 0.7 else "Lower" if pct < 0.3 else "Middle"

    return {
        "rsi": rsi_val,
        "macd_histogram": macd_hist,
        "macd_signal": macd_signal_label,
        "sma_50": sma50_val,
        "sma_200": sma200_val,
        "golden_cross": golden_cross,
        "bb_upper": bb_upper,
        "bb_lower": bb_lower,
        "bb_position": bb_position,
    }


async def get_technical_indicators(symbol: str = "BTCUSDT") -> dict:
    """Return technical indicators for 1d and 4h timeframes."""
    df_1d = await _fetch_klines(symbol, "1d", limit=250)
    df_4h = await _fetch_klines(symbol, "4h", limit=250)
    depth_data = await _fetch_depth(symbol, limit=1000)

    ind_1d = _compute_indicators(df_1d)
    ind_4h = _compute_indicators(df_4h)
    
    current_price = round(float(df_1d["close"].iloc[-1]), 2)
    imbalance = _compute_imbalance(depth_data, current_price)

    return {
        "price": current_price,
        "rsi_1d": ind_1d["rsi"],
        "rsi_4h": ind_4h["rsi"],
        "macd_histogram_1d": ind_1d["macd_histogram"],
        "macd_signal_1d": ind_1d["macd_signal"],
        "sma_50": ind_1d["sma_50"],
        "sma_200": ind_1d["sma_200"],
        "golden_cross": ind_1d["golden_cross"],
        "bb_upper_1d": ind_1d["bb_upper"],
        "bb_lower_1d": ind_1d["bb_lower"],
        "bb_position": ind_1d["bb_position"],
        "order_book_imbalance": imbalance,
    }

def _compute_imbalance(depth: dict, current_price: float, threshold_pct: float = 0.02) -> float:
    lower_bound = current_price * (1 - threshold_pct)
    upper_bound = current_price * (1 + threshold_pct)
    
    bid_vol = 0.0
    for price_str, qty_str in depth.get("bids", []):
        p, q = float(price_str), float(qty_str)
        if p >= lower_bound:
            bid_vol += p * q
            
    ask_vol = 0.0
    for price_str, qty_str in depth.get("asks", []):
        p, q = float(price_str), float(qty_str)
        if p <= upper_bound:
            ask_vol += p * q
            
    if ask_vol == 0:
        return 1.0 if bid_vol > 0 else 0.0
    return bid_vol / ask_vol
