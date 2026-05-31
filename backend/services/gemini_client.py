"""Gemini AI integration for Bitcoin analysis verdicts using google-genai SDK."""

import json
import re

from google import genai
from google.genai import types

from config import settings
from logger import logger

SYSTEM_INSTRUCTION = """Você é um algoritmo de trading institucional e especialista em análise macroeconômica e on-chain. Analise o payload JSON fornecido contendo os indicadores mais importantes da criptomoeda selecionada (incluindo o resumo de notícias recentes injetado no payload).
Avalie confluências, isole anomalias (como preço subindo com Open Interest excessivo, RSI sobrecomprado em múltiplos timeframes, ou divergências entre indicadores técnicos e de sentimento) e gere um relatório estrito em formato JSON contendo:

1. "sentimento_mercado": Exatamente um de "Bullish", "Bearish" ou "Neutro".
2. "forca_tendencia": Um número inteiro de 0 a 100 representando a força da confluência de sinais.
3. "veredito": Exatamente um de "COMPRAR", "VENDER" ou "HOLD".
4. "justificativa_analitica": Um resumo executivo de até 4 frases explicando os fatores determinantes para a tomada de decisão.
5. "cenario_atual": Uma breve análise em texto do cenário cripto/macro atual.
6. "eventos_mercado": Uma lista com NO MÍNIMO 3 eventos geopolíticos/macro/cripto recentes distintos. Cada objeto da lista deve ter as chaves "evento" (string curta), "importancia" ("Alta", "Média", ou "Baixa") e "impacto_descricao" (string explicativa).
7. "previsao_30d": Array com exatamente 30 dias de previsão de preços diários estimada até o futuro (apenas estimativa direcional plausível). Cada objeto: "dia" (int 1 a 30) e "preco" (float, sendo o preço atual o ponto de partida do dia 1).
8. "sinais_trading": Um objeto contendo sugestão de trade com as chaves: "tipo" (exatamente "LONG", "SHORT", ou "NEUTRO"), "entrada" (string com a faixa ou preço de entrada), "alvos_lucro" (lista de strings com os alvos de take profit), "stop_loss" (string com o preço de invalidação) e "risco_recompensa" (string com a relação de risco/retorno, ex: "1:3").

IMPORTANTE:
- Responda APENAS com o JSON válido, sem crases markdown (```json), e sem texto adicional fora do JSON.
- O JSON deve poder ser convertido por `json.loads` nativamente no Python."""


def _extract_json(text: str) -> dict:
    """Extract JSON from Gemini response, handling markdown code blocks."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        # Instead of just passing, log the error for debugging
        from logger import logger
        logger.warning(f"Failed to decode pure JSON: {e}")

    # Try extracting from markdown code blocks
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError as e:
            from logger import logger
            logger.warning(f"Failed to decode markdown JSON: {e}")

    # Try finding JSON object pattern
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as e:
            from logger import logger
            logger.warning(f"Failed to decode regex extracted JSON: {e}")

    raise ValueError(f"Não foi possível extrair JSON válido da resposta do Gemini (tamanho do texto: {len(text)}): {text[:200]}")


async def fetch_latest_news(client, coin: str) -> str:
    """Uses Gemini with the Google Search tool to fetch recent macro/crypto news."""
    try:
        logger.info(f"Buscando notícias recentes para {coin} via Gemini Search...")
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=f"Busque as notícias mais recentes (últimas 24 horas) sobre {coin}, fatores macroeconômicos e geopolíticos globais que afetam o mercado cripto. Retorne um resumo conciso contendo PELO MENOS 3 notícias ou eventos distintos e detalhados.",
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}],
                temperature=0.3,
            ),
        )
        return response.text or "Nenhuma notícia relevante encontrada."
    except Exception as e:
        logger.error(f"Erro ao buscar notícias: {e}")
        return "Não foi possível buscar as notícias no momento."


async def generate_analysis(indicators: dict, coin: str = "BTC") -> dict:
    """Send consolidated indicators to Gemini and return the structured verdict.

    No fallback — raises on any failure.
    """
    if not settings.gemini_api_key:
        raise RuntimeError(
            "GEMINI_API_KEY não configurada. Defina a variável no arquivo .env"
        )

    client = genai.Client(api_key=settings.gemini_api_key)

    # 1. Fetch recent news using the search tool
    recent_news = await fetch_latest_news(client, coin)
    
    # 2. Inject news into the payload for the final analysis
    logger.info(f"Injecting recent news into analysis payload for {coin}...")
    analysis_payload = indicators.copy()
    analysis_payload["noticias_recentes"] = recent_news

    prompt = (
        f"Atue como analista quantitativo sênior focado exclusivamente na dinâmica de preço, fluxo on-chain e fundamentos do ativo {coin}.\n\n"
        f"DIRETRIZES DE ANÁLISE:\n"
        f"1. Confluência Técnico-Macro: Pondere os indicadores matemáticos fornecidos contra o viés extraído do campo 'noticias_recentes'.\n"
        f"2. Busca de Divergências: Procure ativamente por armadilhas de liquidez (ex: preço subindo com volume caindo, ou notícias péssimas ignoradas pelo gráfico).\n"
        f"3. Projeção de Preço (30d): Não crie linhas retas irreais. A previsão deve simular a volatilidade característica do ativo {coin}, respeitando os prováveis níveis de suporte e resistência implícitos no cenário atual.\n\n"
        f"Processe o seguinte snapshot atualizado do mercado e gere o veredito rigorosamente no formato JSON exigido:\n\n"
        f"{json.dumps(analysis_payload, indent=2, ensure_ascii=False)}"
    )

    logger.info(f"Sending prompt to Gemini API for {coin} analysis (max tokens: 8192)...")
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.3,
            max_output_tokens=8192,
            response_mime_type="application/json",
        ),
    )

    if not response.text:
        logger.error(f"Gemini returned an empty response for {coin}")
        raise RuntimeError("Gemini retornou resposta vazia")
    
    logger.success(f"Received valid response from Gemini for {coin}")

    result = _extract_json(response.text)

    # Validate expected fields
    required = [
        "sentimento_mercado", "forca_tendencia", "veredito", 
        "justificativa_analitica", "cenario_atual", "eventos_mercado", "previsao_30d", "sinais_trading"
    ]
    missing = [f for f in required if f not in result]
    if missing:
        logger.error(f"Gemini response for {coin} is missing required fields: {missing}")
        raise ValueError(f"Resposta do Gemini incompleta. Campos faltando: {missing}")

    # Enforce valid values
    if result["sentimento_mercado"] not in ("Bullish", "Bearish", "Neutro"):
        result["sentimento_mercado"] = "Neutro"
    if result["veredito"] not in ("COMPRAR", "VENDER", "HOLD"):
        result["veredito"] = "HOLD"
    result["forca_tendencia"] = max(0, min(100, int(result["forca_tendencia"])))

    return result
