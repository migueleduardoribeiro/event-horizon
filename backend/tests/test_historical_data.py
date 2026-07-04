import pytest
from unittest.mock import patch
import pandas as pd
from services.historical_data import get_historical_data

@patch("services.historical_data._fetch_binance_history")
def test_get_historical_data_caches(mock_fetch):
    mock_fetch.return_value = pd.DataFrame({
        "date": ["2024-01-01"], "price": [45000], "rsi_1d": [50], "sma_50": [40000],
        "sma_200": [35000], "bb_upper_1d": [48000], "bb_lower_1d": [42000],
        "funding_rate": [0.01], "long_short_ratio": [1.5], "cvd_24h": [1000]
    })
    # First call should fetch
    df1 = get_historical_data("2024-01-01", "2024-01-01")
    assert mock_fetch.call_count == 1
    assert not df1.empty
    
    # Second call should use cache
    df2 = get_historical_data("2024-01-01", "2024-01-01")
    assert mock_fetch.call_count == 1
