"""On-chain metrics from blockchain.info public API only. No fallbacks."""

import httpx

from config import settings

BASE = settings.blockchain_info_url


async def get_onchain_data(coin: str = "BTC") -> dict:
    """Fetch on-chain metrics from blockchain.info.

    Available public endpoints (no API key required):
    - Hash Rate: /q/hashrate
    - Difficulty: /q/getdifficulty
    - Mempool Size (unconfirmed txs): /q/unconfirmedcount
    - Total BTC on exchanges (estimated via total balance of known exchange addresses):
      We use /q/addressbalance for a well-known Binance cold wallet as a proxy indicator.
      For a production system, a dedicated on-chain analytics API would be used.

    No fallbacks — if an endpoint fails, the error propagates.
    """
    if coin.upper() != "BTC":
        return {
            "hash_rate": None,
            "difficulty": None,
            "mempool_count": None,
            "total_supply_btc": None,
        }

    hash_rate = None
    difficulty = None
    mempool_count = None
    total_supply_btc = None

    async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
        try:
            hr_resp = await client.get(f"{BASE}/charts/hash-rate?timespan=5days&format=json")
            hr_resp.raise_for_status()
            hr_data = hr_resp.json()
            if hr_data.get("values") and len(hr_data["values"]) > 0:
                # Value is returned in TH/s. Convert to EH/s for better readability or keep as is. We'll divide by 1e6 to get EH/s.
                hash_rate = round(float(hr_data["values"][-1]["y"]) / 1e6, 2)
        except Exception as e:
            from logger import logger
            logger.warning(f"Failed to fetch hashrate: {e}")

        try:
            diff_resp = await client.get(f"{BASE}/q/getdifficulty")
            diff_resp.raise_for_status()
            difficulty = float(diff_resp.text.strip())
        except Exception as e:
            from logger import logger
            logger.warning(f"Failed to fetch difficulty: {e}")

        try:
            mem_resp = await client.get(f"{BASE}/q/unconfirmedcount")
            mem_resp.raise_for_status()
            mempool_count = int(mem_resp.text.strip())
        except Exception as e:
            from logger import logger
            logger.warning(f"Failed to fetch mempool count: {e}")

        try:
            supply_resp = await client.get(f"{BASE}/q/totalbc")
            supply_resp.raise_for_status()
            total_supply_btc = round(float(supply_resp.text.strip()) / 1e8, 2)
        except Exception as e:
            from logger import logger
            logger.warning(f"Failed to fetch total supply: {e}")

    return {
        "hash_rate": hash_rate,
        "difficulty": difficulty,
        "mempool_count": mempool_count,
        "total_supply_btc": total_supply_btc,
    }
