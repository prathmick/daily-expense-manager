from datetime import datetime, date
from typing import Optional
from enum import Enum
from pydantic import BaseModel, EmailStr, field_validator


class CategoryEnum(str, Enum):
    FOOD = "Food"
    TRAVEL = "Travel"
    SHOPPING = "Shopping"
    BILLS = "Bills"
    OTHERS = "Others"


# ── Auth schemas ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v


class UserOut(BaseModel):
    id: int
    email: EmailStr
    display_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# ── Expense schemas ───────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    amount: float
    category: CategoryEnum
    date: date
    description: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v

    @field_validator("description")
    @classmethod
    def description_max_length(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 255:
            raise ValueError("description must be at most 255 characters")
        return v


class ExpenseOut(BaseModel):
    id: int
    user_id: int
    amount: float
    category: CategoryEnum
    date: date
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseCreateOut(ExpenseOut):
    budget_alert: Optional[str] = None  # "none", "warning", "over-budget"


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[CategoryEnum] = None
    date: Optional[date] = None
    description: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("amount must be greater than 0")
        return v

    @field_validator("description")
    @classmethod
    def description_max_length(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 255:
            raise ValueError("description must be at most 255 characters")
        return v


# ── Report schemas ────────────────────────────────────────────────────────────

class CategorySummary(BaseModel):
    category: CategoryEnum
    total: float
    percentage: float


class MonthlyReportOut(BaseModel):
    year: int
    month: int
    total_amount: float
    expense_count: int
    category_breakdown: list[CategorySummary]


# ── Budget schemas ────────────────────────────────────────────────────────────

class BudgetSet(BaseModel):
    category: CategoryEnum
    monthly_limit: float

    @field_validator("monthly_limit")
    @classmethod
    def limit_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("monthly_limit must be greater than 0")
        return v


class BudgetOut(BaseModel):
    id: int
    user_id: int
    category: CategoryEnum
    monthly_limit: float
    current_spending: float
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Error schema ──────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    status_code: int
    detail: str


# ── Balance schemas ───────────────────────────────────────────────────────────

class BalanceSet(BaseModel):
    balance: float

    @field_validator("balance")
    @classmethod
    def balance_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("balance cannot be negative")
        return v


class BalanceOut(BaseModel):
    balance: float
    total_expenses: float
    current_balance: float
