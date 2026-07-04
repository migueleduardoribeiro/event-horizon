from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch
import pandas as pd

client = TestClient(app)

@patch("routers.backtest.get_historical_data")
@patch("routers.backtest.run_backtest")
def test_run_backtest_endpoint(mock_run, mock_get):
    mock_get.return_value = pd.DataFrame({"date": ["2024-01-01"]})
    mock_run.return_value = {"summary": {"total_trades": 5, "roi_pct": 10.0}}
    
    response = client.post("/api/backtest/run", json={
        "start_date": "2024-01-01",
        "end_date": "2024-02-01",
        "initial_capital": 10000
    })
    
    assert response.status_code == 200
    assert response.json()["summary"]["total_trades"] == 5
