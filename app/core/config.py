from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GROQ_API_KEY: str
    MAIL_FROM: str
    BREVO_API_KEY: str
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_ID: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
