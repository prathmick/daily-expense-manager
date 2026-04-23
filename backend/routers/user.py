from datetime import date
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User, Expense
from schemas import BalanceSet, BalanceOut

router = APIRouter()


def _build_balance_out(db: Session, user: User) -> BalanceOut:
    today = date.today()

    total_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(Expense.user_id == user.id)
        .scalar()
    ) or 0.0

    month_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == user.id,
            func.strftime("%Y", Expense.date) == str(today.year),
            func.strftime("%m", Expense.date) == f"{today.month:02d}",
        )
        .scalar()
    ) or 0.0

    month_remaining = user.monthly_salary - month_expenses if user.monthly_salary > 0 else 0.0

    return BalanceOut(
        balance=user.balance,
        monthly_salary=user.monthly_salary,
        total_expenses=total_expenses,
        current_balance=user.balance - total_expenses,
        month_expenses=month_expenses,
        month_remaining=month_remaining,
    )


@router.get("/balance", response_model=BalanceOut)
def get_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _build_balance_out(db, current_user)


@router.put("/balance", response_model=BalanceOut)
def set_balance(
    body: BalanceSet,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.balance = body.balance
    if body.monthly_salary is not None:
        current_user.monthly_salary = body.monthly_salary
    db.commit()
    db.refresh(current_user)
    return _build_balance_out(db, current_user)


class SalarySet(BaseModel):
    monthly_salary: float


@router.put("/salary", response_model=BalanceOut)
def set_salary(
    body: SalarySet,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.monthly_salary = body.monthly_salary
    db.commit()
    db.refresh(current_user)
    return _build_balance_out(db, current_user)
