"""Bitcoin Confluence Dashboard — FastAPI Backend.

Collects market indicators from public APIs and integrates with
Google Gemini for predictive analysis reports.
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import indicators, analysis
from services.binance_ws import start_liquidation_websocket
from logger import setup_logger, logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logger()
    logger.info("Starting Bitcoin Confluence Dashboard Backend...")
    # Start the background task for Binance Websocket
    task = asyncio.create_task(start_liquidation_websocket("BTCUSDT"))
    yield
    # Cancel the task on shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Bitcoin Confluence Dashboard API",
    description="Real-time Bitcoin indicator collection and Gemini-powered analysis",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server and Docker
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://frontend:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(indicators.router)
app.include_router(analysis.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global error handler — never swallow errors silently."""
    return JSONResponse(
        status_code=500,
        content={
            "error": f"{type(exc).__name__}: {str(exc)}",
            "detail": "An unexpected error occurred in the backend.",
        },
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "bitcoin-confluence-dashboard"}
