import asyncio
import json
from collections import deque
import websockets

from logger import logger

class LiquidationTracker:
    def __init__(self, maxlen=100):
        self.liquidations = deque(maxlen=maxlen)

    def add(self, liq_data: dict):
        self.liquidations.append(liq_data)

    def get_all(self):
        return list(self.liquidations)

# Global singleton
liquidation_tracker = LiquidationTracker()

async def start_liquidation_websocket(symbol: str = "BTCUSDT"):
    """
    Connects to the Binance Futures WebSocket stream for force orders (liquidations).
    Keeps the connection alive and reconnects on failure.
    """
    stream_url = f"wss://fstream.binance.com/ws/{symbol.lower()}@forceOrder"
    
    while True:
        try:
            logger.info(f"Connecting to Binance WebSocket: {stream_url}")
            async with websockets.connect(stream_url) as ws:
                logger.info("Successfully connected to Binance WebSocket")
                while True:
                    msg = await ws.recv()
                    data = json.loads(msg)
                    
                    if "o" in data:
                        order_data = data["o"]
                        # We extract only the fields we need to match the previous API format
                        side = order_data.get("S")
                        qty = float(order_data.get("q", 0))
                        price = float(order_data.get("p", 0))
                        
                        liquidation_tracker.add({
                            "side": side,
                            "executedQty": qty,
                            "averagePrice": price
                        })
                        
        except (websockets.ConnectionClosed, Exception) as e:
            logger.error(f"WebSocket connection closed or error: {e}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)
