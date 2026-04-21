import logging
import os

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from database import engine, SessionLocal, Base
from models import Category
from routers.auth import router as auth_router
from routers.budgets import router as budget_router
from routers.expenses import router as expense_router
from routers.reports import router as report_router
from routers.user import router as user_router

logger = logging.getLogger(__name__)

app = FastAPI(title="Daily Expense Manager API")

# Allow localhost dev + any Vercel/Netlify deployment URL via env var
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:4173",
]
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    ALLOWED_ORIGINS.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.(vercel\.app|netlify\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = exc.errors()
    detail = errors[0]["msg"] if errors else "Validation error"
    return JSONResponse(
        status_code=422,
        content={"status_code": 422, "detail": detail}
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status_code": exc.status_code, "detail": str(exc.detail)}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.exception("Unhandled exception", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"status_code": 500, "detail": "Internal server error"}
    )


@app.on_event("startup")
def startup_event():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Seed categories if not present
    db = SessionLocal()
    try:
        existing_categories = db.query(Category).count()
        if existing_categories == 0:
            default_categories = ["Food", "Travel", "Shopping", "Bills", "Others"]
            for cat_name in default_categories:
                db.add(Category(name=cat_name))
            db.commit()
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Daily Expense Manager API"}


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(expense_router, prefix="/expenses", tags=["expenses"])
app.include_router(report_router, prefix="/reports", tags=["reports"])
app.include_router(budget_router, prefix="/budgets", tags=["budgets"])
app.include_router(user_router, prefix="/user", tags=["user"])
