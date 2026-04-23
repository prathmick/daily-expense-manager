import os

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-use-a-long-random-string")

# Railway injects DATABASE_URL automatically when you add a PostgreSQL plugin
# Falls back to local SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./expense_manager.db")

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7   # 7 days — keeps users logged in
REFRESH_TOKEN_EXPIRE_DAYS = 30               # 30 days refresh token
