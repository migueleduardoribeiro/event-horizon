# ₿ Bitcoin Confluence Dashboard (Event Horizon)

A predictive Bitcoin analysis dashboard that aggregates 20+ market indicators in real-time and uses Google Gemini AI to generate comprehensive **BUY**, **SELL**, or **HOLD** verdicts.

## 🚀 Project Overview

The **Event Horizon** dashboard continuously monitors the state of the cryptocurrency market by pulling data across various domains: Technical, Derivatives, Sentiment, Macro, and On-Chain. It feeds this rich dataset into the Google Gemini API to produce an actionable, AI-driven market analysis. The application features a FastAPI backend for data aggregation and a dark-terminal-themed Next.js frontend for an immersive user experience.

## 🧠 Analysis Modes

The Event Horizon dashboard offers three distinct modes for market analysis, each catering to a different analytical approach:

- **AI (Full Gemini):** Feeds all aggregated technical, derivatives, sentiment, macro, and on-chain indicators into the Google Gemini LLM. It leverages natural language reasoning to produce a nuanced, narrative-driven market analysis and a holistic **BUY**, **SELL**, or **HOLD** verdict.
- **Algo (Deterministic Math):** Evaluates market conditions using a strict, rules-based mathematical scoring system. It scores various indicator categories objectively, bypassing the LLM entirely to produce a lightning-fast, purely quantitative verdict.
- **Hybrid (Math + AI Macro Scoring):** Combines the objective precision of deterministic math with the contextual awareness of AI. The AI evaluates complex macroeconomic and sentiment narratives to generate a score, while the algorithm handles technical and derivatives data. These scores are then merged to produce a highly robust, comprehensive final verdict.

## 🛠️ Technologies Used

### Backend
- **FastAPI** (Python 3.10+) - High-performance web framework.
- **Loguru** - Beautiful, colorful, structured console logging.
- **Binance API** - Real-time technical and derivatives data.
- **FRED API** (Federal Reserve Economic Data) - Macroeconomic indicators (M2, CPI, NFP).
- **Yahoo Finance (`yfinance`)** - DXY (US Dollar Index) data.
- **Alternative.me API** - Crypto Fear & Greed Index.
- **Blockchain.info API** - On-Chain metrics.
- **Gemini API** - AI-powered market analysis and verdict generation.

### Frontend
- **Next.js** (React) - Modern frontend framework.
- **Tailwind CSS** - For styling the dark terminal theme.

### Infrastructure
- **Docker Compose** - Containerized deployment for both backend and frontend.

## 📊 Monitored Indicators

| Category | Indicators | Source |
|----------|------------|--------|
| **Technical** | Price, RSI (1D & 4H), MACD Histogram & Signal, SMA 50 & 200, Golden Cross, Bollinger Bands (Upper/Lower/Position), Order Book Imbalance | Binance API |
| **Derivatives** | Open Interest, Funding Rate, Long/Short Ratio, Recent Liquidations (Long/Short), CVD 24h | Binance Futures |
| **Sentiment** | Fear & Greed Index, Fear & Greed Label | Alternative.me |
| **Macro** | DXY Value & Change %, Global Liquidity (M2), NFP Trend, CPI Trend, NASDAQ 100 Correlation | Yahoo Finance, FRED API |
| **On-Chain** | Hash Rate, Difficulty, Mempool Count, Total Supply (BTC) | Blockchain.info |

## ⚙️ Setup Instructions

### 1. Environment Configuration

Clone the repository and set up your environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file and add your API keys:
```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# FRED API Key (from https://fred.stlouisfed.org/docs/api/api_key.html)
FRED_API_KEY=your_fred_api_key_here

# Optional Configurations
GEMINI_MODEL=gemini-2.5-flash-lite
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Running Locally (Without Docker)

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000) and the backend API at [http://localhost:8000](http://localhost:8000).

### 3. Running via Docker Compose (Recommended)

To spin up both the backend and frontend simultaneously using Docker Compose:

```bash
# From the root directory
docker compose up --build
```

- **Frontend Application:** `http://localhost:3000`
- **Backend API Documentation:** `http://localhost:8000/docs`

## 📡 API Endpoints

- `GET /health` — API health check.
- `GET /api/indicators` — Aggregates and returns all market indicators in parallel.
- `POST /api/analysis` — Collects current indicators and streams the Gemini AI analysis.

## 📝 Logging System

The backend features a unified, colorful, and structured logging system powered by `loguru`. This is fully configured in `backend/logger.py`. 

**Key features include:**
- **Unified Output:** Intercepts standard Python `logging` messages and routes them through `loguru`.
- **Framework Integration:** Captures all logs from Uvicorn (`uvicorn`, `uvicorn.access`, `uvicorn.error`) and FastAPI, ensuring consistency across all terminal output.
- **Rich Formatting:** Displays timestamps, log levels, module names, functions, and line numbers using a highly readable, colorized terminal format.

To use the logger in any backend module:
```python
from logger import logger

logger.info("Informational message")
logger.warning("Warning message")
logger.error("Error occurred!")
```
