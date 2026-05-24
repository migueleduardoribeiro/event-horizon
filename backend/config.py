"""Configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"
    binance_base_url: str = "https://api.binance.com"
    binance_futures_url: str = "https://fapi.binance.com"
    fng_url: str = "https://api.alternative.me/fng/"
    blockchain_info_url: str = "https://api.blockchain.info"
    fred_api_key: str = ""
    fred_base_url: str = "https://api.stlouisfed.org/fred"
    request_timeout: int = 15

    model_config = {
        "env_file": (".env", "../.env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


settings = Settings()
