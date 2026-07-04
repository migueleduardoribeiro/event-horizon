import sqlite3
import pandas as pd
import os
import yfinance as yf
from ta.momentum import RSIIndicator
from ta.trend import SMAIndicator, MACD
from ta.volatility import BollingerBands

DB_PATH = "backend/data/historical.db"

def _init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''CREATE TABLE IF NOT EXISTS historical_data
                   (date TEXT PRIMARY KEY, price REAL, rsi_1d REAL, sma_50 REAL, 
                    sma_200 REAL, bb_upper_1d REAL, bb_lower_1d REAL,
                    funding_rate REAL, long_short_ratio REAL, cvd_24h REAL,
                    macd_signal_1d TEXT, golden_cross INTEGER, order_book_imbalance REAL,
                    fear_greed_index REAL, dxy_change_pct REAL, hash_rate REAL)''')
    conn.commit()
    return conn

def _fetch_binance_history(start_date: str, end_date: str) -> pd.DataFrame:
    # Use yfinance to fetch BTC-USD for the date range
    # Add a buffer before start_date to calculate 200 SMA
    fetch_start = pd.to_datetime(start_date) - pd.Timedelta(days=250)
    df = yf.download("BTC-USD", start=fetch_start.strftime('%Y-%m-%d'), end=pd.to_datetime(end_date) + pd.Timedelta(days=1), progress=False)
    
    if df.empty:
        return pd.DataFrame()

    # Flatten columns if using multi-index in yfinance
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df = df.reset_index()
    df["date"] = df["Date"].dt.strftime('%Y-%m-%d')
    df["price"] = df["Close"]

    # Calculate indicators
    df["rsi_1d"] = RSIIndicator(close=df["Close"], window=14).rsi()
    df["sma_50"] = SMAIndicator(close=df["Close"], window=50).sma_indicator()
    df["sma_200"] = SMAIndicator(close=df["Close"], window=200).sma_indicator()
    
    bb = BollingerBands(close=df["Close"], window=20, window_dev=2)
    df["bb_upper_1d"] = bb.bollinger_hband()
    df["bb_lower_1d"] = bb.bollinger_lband()
    
    macd = MACD(close=df["Close"])
    macd_diff = macd.macd_diff()
    # Simple BULLISH/BEARISH assignment
    df["macd_signal_1d"] = macd_diff.apply(lambda x: "BULLISH" if x > 0 else "BEARISH")
    
    # Golden cross check: sma_50 > sma_200
    df["golden_cross"] = df["sma_50"] > df["sma_200"]
    
    # Fill mock values for derivatives/sentiment/onchain since public APIs don't easily give history for free without limits
    df["funding_rate"] = 0.001
    df["long_short_ratio"] = 1.0
    df["cvd_24h"] = 0
    df["order_book_imbalance"] = 1.0
    df["fear_greed_index"] = 50
    df["dxy_change_pct"] = 0.0
    df["hash_rate"] = 600

    # Filter to only the requested dates
    mask = (df["date"] >= start_date) & (df["date"] <= end_date)
    result_df = df.loc[mask].copy()
    
    # Keep only the needed columns
    cols_to_keep = ["date", "price", "rsi_1d", "sma_50", "sma_200", "bb_upper_1d", 
                    "bb_lower_1d", "funding_rate", "long_short_ratio", "cvd_24h",
                    "macd_signal_1d", "golden_cross", "order_book_imbalance",
                    "fear_greed_index", "dxy_change_pct", "hash_rate"]
    
    return result_df[cols_to_keep].dropna()

def get_historical_data(start_date: str, end_date: str) -> pd.DataFrame:
    conn = _init_db()
    df_cache = pd.read_sql_query(f"SELECT * FROM historical_data WHERE date >= '{start_date}' AND date <= '{end_date}'", conn)
    
    if df_cache.empty or len(df_cache) < (pd.to_datetime(end_date) - pd.to_datetime(start_date)).days:
        # Fetch fresh if cache is empty or incomplete
        df_new = _fetch_binance_history(start_date, end_date)
        if not df_new.empty:
            # Overwrite cache with new data
            df_new.to_sql("historical_data", conn, if_exists="replace", index=False)
            return df_new
    return df_cache
