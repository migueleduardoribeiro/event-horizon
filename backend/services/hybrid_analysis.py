"""Hybrid Analysis combining AI macro/news scoring with algorithmic technicals."""

import json
from google import genai
from google.genai import types

from config import settings
from logger import logger
from services.gemini_client import fetch_latest_news, _extract_json
from services.algo_analysis import generate_algo_analysis, generate_trade_setup

SYSTEM_INSTRUCTION_HYBRID = """Você é um especialista em análise macroeconômica e geopolítica focado em criptomoedas.
Analise o resumo de notícias fornecido e os indicadores e gere um score de impacto no mercado de -25 a +25.
-25 significa extremo pessimismo/bearish.
+25 significa extremo otimismo/bullish.
0 significa neutro.

Gere um relatório estrito em formato JSON contendo:
1. "score": Um número inteiro de -25 a 25.
2. "justificativa_analitica": Um resumo de até 3 frases explicando o score.
3. "cenario_atual": Uma breve análise em texto do cenário cripto/macro atual.
4. "eventos_mercado": Uma lista com NO MÍNIMO 3 eventos geopolíticos/macro/cripto recentes distintos. Cada objeto da lista deve ter as chaves "evento" (string curta), "importancia" ("Alta", "Média", ou "Baixa") e "impacto_descricao" (string explicativa).

IMPORTANTE:
- Responda APENAS com o JSON válido, sem crases markdown.
"""

async def generate_hybrid_analysis(indicators: dict, coin: str = "BTC") -> dict:
    """Generate hybrid analysis combining Algo scores and AI news scoring."""
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY não configurada.")
    
    client = genai.Client(api_key=settings.gemini_api_key)
    
    # 1. Fetch latest news
    recent_news = await fetch_latest_news(client, coin)
    
    # 2. Ask Gemini for a score (-25 to +25)
    prompt = (
        f"Ativo: {coin}\n"
        f"Notícias e Eventos Recentes:\n{recent_news}\n\n"
        f"Gere o JSON com o score, justificativa, cenario e eventos."
    )
    
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION_HYBRID,
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )
    
    if not response.text:
        raise RuntimeError("Gemini retornou resposta vazia")
        
    ai_result = _extract_json(response.text)
    
    # 3. Call generate_algo_analysis
    algo_result = generate_algo_analysis(indicators)
    
    # 4. Combine scores
    ai_score = int(ai_result.get("score", 0))
    # clamp AI score between -25 and +25
    ai_score = max(-25, min(25, ai_score))
    
    base_forca = algo_result["forca_tendencia"]
    # Add ai_score to base_forca and clamp 0-100
    final_forca = max(0, min(100, base_forca + ai_score))
    
    # Recalculate veredito based on final_forca
    if final_forca >= 55:
        sentimento = "Bullish"
        veredito = "COMPRAR"
        tipo = "LONG"
    elif final_forca <= 45:
        sentimento = "Bearish"
        veredito = "VENDER"
        tipo = "SHORT"
    else:
        sentimento = "Neutro"
        veredito = "HOLD"
        tipo = "NEUTRO"
        
    # Update algo_result with hybrid data
    algo_result["sentimento_mercado"] = sentimento
    algo_result["veredito"] = veredito
    algo_result["forca_tendencia"] = final_forca
    
    algo_result["sinais_trading"] = generate_trade_setup(indicators.get("technical", {}), tipo)
    
    # Combine justificativas
    algo_justificativa = algo_result["justificativa_analitica"]
    ai_justificativa = ai_result.get("justificativa_analitica", "")
    
    algo_result["justificativa_analitica"] = (
        f"[Análise Híbrida]\n"
        f"Impacto IA Macro/Notícias: {ai_score} pts\n"
        f"Resumo IA: {ai_justificativa}\n\n"
        f"Base Algorítmica:\n{algo_justificativa}"
    )
    
    algo_result["cenario_atual"] = ai_result.get("cenario_atual", "")
    algo_result["eventos_mercado"] = ai_result.get("eventos_mercado", [])
    
    # For previsao_30d we can leave it empty since ForecastChart is not rendered for hybrid
    algo_result["previsao_30d"] = []
    
    return algo_result
