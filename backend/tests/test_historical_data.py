import pytest
from unittest.mock import patch, MagicMock
import pandas as pd
from services.historical_data import get_historical_data
import sqlite3

@patch("services.historical_data._init_db")
@patch("services.historical_data._fetch_binance_history")
def test_get_historical_data_caches(mock_fetch, mock_init):
    # Use an in-memory database for testing
    conn = sqlite3.connect(":memory:")
    conn.execute('''CREATE TABLE IF NOT EXISTS historical_data
                   (date TEXT PRIMARY KEY, price REAL, rsi_1d REAL, sma_50 REAL, 
                    sma_200 REAL, bb_upper_1d REAL, bb_lower_1d REAL,
                    funding_rate REAL, long_short_ratio REAL, cvd_24h REAL,
                    macd_signal_1d TEXT, golden_cross INTEGER, order_book_imbalance REAL,
                    fear_greed_index REAL, dxy_change_pct REAL, hash_rate REAL)''')
    mock_init.return_value = conn
    
    mock_fetch.return_value = pd.DataFrame({
        "date": ["2024-01-01"], "price": [45000], "rsi_1d": [50], "sma_50": [40000],
        "sma_200": [35000], "bb_upper_1d": [48000], "bb_lower_1d": [42000],
        "funding_rate": [0.01], "long_short_ratio": [1.5], "cvd_24h": [1000],
        "macd_signal_1d": ["BULLISH"], "golden_cross": [True], "order_book_imbalance": [1.0],
        "fear_greed_index": [50], "dxy_change_pct": [0.0], "hash_rate": [600]
    })
    # First call should fetch
    df1 = get_historical_data("2024-01-01", "2024-01-01")
    assert mock_fetch.call_count == 1
    assert not df1.empty
    
    # Second call should use cache
    df2 = get_historical_data("2024-01-01", "2024-01-01")
    assert mock_fetch.call_count == 1
