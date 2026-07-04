from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.historical_data import get_historical_data
from services.backtest_engine import run_backtest

router = APIRouter(prefix="/api/backtest", tags=["backtest"])

class BacktestRequest(BaseModel):
    start_date: str
    end_date: str
    initial_capital: float = 10000.0

@router.post("/run")
async def run_backtest_endpoint(request: BacktestRequest):
    try:
        df = get_historical_data(request.start_date, request.end_date)
        if df.empty:
            raise HTTPException(status_code=400, detail="No historical data found for the given dates.")
        
        result = run_backtest(df, request.initial_capital)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
