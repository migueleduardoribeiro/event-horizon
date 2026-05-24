"""POST /api/analysis — Collect indicators + send to Gemini for verdict."""

from fastapi import APIRouter, HTTPException

from routers.indicators import fetch_indicators
from services.gemini_client import generate_analysis

from logger import logger

router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/analysis")
async def run_analysis(coin: str = "BTC"):
    """Collect all indicators, send to Gemini, return analysis.

    - If indicator collection has partial errors, they are passed through.
    - If Gemini fails, analysis_error is populated — NO fallback.
    """
    coin = coin.upper()
    # Step 1: Collect indicators (same logic as GET /indicators)
    indicator_data = await fetch_indicators(coin)

    # Step 2: Send to Gemini
    analysis = None
    analysis_error = None
    try:
        logger.info(f"Generating AI analysis for {coin}...")
        analysis = await generate_analysis(indicator_data, coin)
        logger.success(f"AI analysis generated successfully for {coin}")
    except Exception as exc:
        analysis_error = f"{type(exc).__name__}: {exc}"
        logger.error(f"Failed to generate AI analysis: {analysis_error}")

    return {
        "indicators": indicator_data,
        "analysis": analysis,
        "analysis_error": analysis_error,
    }
