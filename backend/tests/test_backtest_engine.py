from services.backtest_engine import run_backtest
import pandas as pd

def test_run_backtest():
    data = pd.DataFrame({
        "date": ["2024-01-01", "2024-01-02", "2024-01-03"],
        "price": [40000, 42000, 45000],
        "rsi_1d": [30, 50, 70],
        "macd_signal_1d": ["BULLISH", "BULLISH", "BULLISH"],
        "golden_cross": [True, True, True],
        "order_book_imbalance": [1.5, 1.0, 1.0],
        "sma_50": [35000, 35000, 35000],
        "sma_200": [30000, 30000, 30000],
        "bb_upper_1d": [44000, 44000, 44000],
        "bb_lower_1d": [36000, 36000, 36000],
        "funding_rate": [-0.01, 0, 0],
        "long_short_ratio": [0.5, 1.0, 1.0],
        "cvd_24h": [2000, 0, 0],
        "fear_greed_index": [20, 50, 80],
        "dxy_change_pct": [-1, 0, 0],
        "hash_rate": [150, 150, 150]
    })
    
    result = run_backtest(data, 10000)
    assert result["summary"]["total_trades"] > 0
    assert result["summary"]["final_capital"] != 10000
