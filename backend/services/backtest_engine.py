import pandas as pd
from services.algo_analysis import generate_algo_analysis, generate_trade_setup

def run_backtest(df: pd.DataFrame, initial_capital: float) -> dict:
    capital = initial_capital
    trades = []
    equity_curve = []
    active_trade = None
    
    for idx, row in df.iterrows():
        indicators = {
            "technical": {
                "price": row.get("price"), "rsi_1d": row.get("rsi_1d"),
                "macd_signal_1d": row.get("macd_signal_1d"), "golden_cross": row.get("golden_cross"),
                "order_book_imbalance": row.get("order_book_imbalance"), "sma_50": row.get("sma_50"),
                "sma_200": row.get("sma_200"), "bb_upper_1d": row.get("bb_upper_1d"),
                "bb_lower_1d": row.get("bb_lower_1d")
            },
            "derivatives": {
                "funding_rate": row.get("funding_rate"), "long_short_ratio": row.get("long_short_ratio"),
                "cvd_24h": row.get("cvd_24h")
            },
            "sentiment": {"fear_greed_index": row.get("fear_greed_index")},
            "macro": {"dxy_change_pct": row.get("dxy_change_pct")},
            "onchain": {"hash_rate": row.get("hash_rate")}
        }
        
        current_price = row.get("price")
        
        if active_trade:
            if active_trade["tipo"] == "LONG":
                if current_price >= active_trade["tp"] or current_price <= active_trade["sl"]:
                    pnl_type = "Profit" if current_price >= active_trade["tp"] else "Loss"
                    capital += capital * ((current_price - active_trade["entry_price"]) / active_trade["entry_price"])
                    trades.append({**active_trade, "exit_date": row["date"], "exit_price": current_price, "pnl": pnl_type})
                    active_trade = None
            elif active_trade["tipo"] == "SHORT":
                if current_price <= active_trade["tp"] or current_price >= active_trade["sl"]:
                    pnl_type = "Profit" if current_price <= active_trade["tp"] else "Loss"
                    capital += capital * ((active_trade["entry_price"] - current_price) / active_trade["entry_price"])
                    trades.append({**active_trade, "exit_date": row["date"], "exit_price": current_price, "pnl": pnl_type})
                    active_trade = None
            
        if not active_trade:
            analysis = generate_algo_analysis(indicators)
            tipo = analysis["sinais_trading"]["tipo"]
            if tipo in ["LONG", "SHORT"]:
                setup = generate_trade_setup(indicators["technical"], tipo)
                tp_val = float(setup["alvos_lucro"][0].replace('$', '').replace(',', ''))
                sl_val = float(setup["stop_loss"].replace('$', '').replace(',', ''))
                
                active_trade = {
                    "entry_date": row["date"], "tipo": tipo,
                    "entry_price": current_price, "tp": tp_val, "sl": sl_val
                }
                
        equity_curve.append({"date": row["date"], "balance": capital})
        
    roi = ((capital - initial_capital) / initial_capital) * 100 if initial_capital > 0 else 0
    
    return {
        "summary": {
            "initial_capital": initial_capital, "final_capital": capital,
            "roi_pct": roi, "total_trades": len(trades)
        },
        "trades": trades, "equity_curve": equity_curve
    }
