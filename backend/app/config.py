from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://signaliq:signaliq@localhost:5432/signaliq"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    frontend_origin: str = "http://localhost:3000"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
