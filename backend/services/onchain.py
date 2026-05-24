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

    async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
        # Hash Rate (TH/s returned as a gigahash number)
        hr_resp = await client.get(f"{BASE}/q/hashrate")
        hr_resp.raise_for_status()
        hash_rate = float(hr_resp.text.strip())

        # Difficulty
        diff_resp = await client.get(f"{BASE}/q/getdifficulty")
        diff_resp.raise_for_status()
        difficulty = float(diff_resp.text.strip())

        # Unconfirmed transactions (mempool proxy)
        mem_resp = await client.get(f"{BASE}/q/unconfirmedcount")
        mem_resp.raise_for_status()
        mempool_count = int(mem_resp.text.strip())

        # Miners revenue (last 24h in USD) — /q/miners-revenue (available publicly)
        # Using total BTC in circulation as additional on-chain metric
        supply_resp = await client.get(f"{BASE}/q/totalbc")
        supply_resp.raise_for_status()
        # Returned in satoshis
        total_supply_btc = round(float(supply_resp.text.strip()) / 1e8, 2)

    return {
        "hash_rate": hash_rate,
        "difficulty": difficulty,
        "mempool_count": mempool_count,
        "total_supply_btc": total_supply_btc,
    }
