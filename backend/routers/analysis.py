"""POST /api/analysis — Collect indicators + run analysis (AI, Algo, or Hybrid)."""

from fastapi import APIRouter, HTTPException, Query

from routers.indicators import fetch_indicators
from services.gemini_client import generate_analysis
from services.algo_analysis import generate_algo_analysis
from services.hybrid_analysis import generate_hybrid_analysis

from logger import logger

router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/analysis")
async def run_analysis(coin: str = "BTC", type: str = Query("ai", description="Analysis type: 'ai', 'algo', or 'hybrid'")):
    """Collect all indicators, generate requested analysis, return payload."""
    coin = coin.upper()
    logger.info(f"Received /analysis request for {coin} (Type: {type.upper()})")
    
    logger.info(f"Fetching indicators for {coin}...")
    indicator_data = await fetch_indicators(coin)
    logger.success(f"Successfully fetched indicators for {coin}")


    analysis = None
    analysis_error = None
    
    try:
        if type == "algo":
            logger.info(f"Generating Algorithmic analysis for {coin}...")
            analysis = generate_algo_analysis(indicator_data)
            logger.success(f"Algorithmic analysis generated successfully for {coin}")
        elif type == "hybrid":
            logger.info(f"Generating Hybrid analysis for {coin}...")
            analysis = await generate_hybrid_analysis(indicator_data, coin)
            logger.success(f"Hybrid analysis generated successfully for {coin}")
        else:
            logger.info(f"Generating AI analysis for {coin}...")
            analysis = await generate_analysis(indicator_data, coin)
            logger.success(f"AI analysis generated successfully for {coin}")
    except Exception as exc:
        analysis_error = f"{type(exc).__name__}: {exc}"
        logger.error(f"Failed to generate {type.upper()} analysis: {analysis_error}")

    return {
        "indicators": indicator_data,
        "analysis": analysis,
        "analysis_error": analysis_error,
        "type": type
    }
