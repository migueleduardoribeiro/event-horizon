"""Crypto Fear & Greed Index from Alternative.me."""

import httpx

from config import settings


async def get_sentiment_data() -> dict:
    """Fetch the latest Fear & Greed Index."""
    url = f"{settings.fng_url}"
    params = {"limit": "1"}

    async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    fng_data = data.get("data", [{}])[0]
    value = int(fng_data.get("value", 0))
    label = fng_data.get("value_classification", "Unknown")

    return {
        "fear_greed_index": value,
        "fear_greed_label": label,
    }
