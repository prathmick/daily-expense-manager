from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User, Expense
from schemas import BalanceSet, BalanceOut

router = APIRouter()


@router.get("/balance", response_model=BalanceOut)
def get_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(Expense.user_id == current_user.id)
        .scalar()
    ) or 0.0
    return BalanceOut(
        balance=current_user.balance,
        total_expenses=total_expenses,
        current_balance=current_user.balance - total_expenses,
    )


@router.put("/balance", response_model=BalanceOut)
def set_balance(
    body: BalanceSet,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.balance = body.balance
    db.commit()
    db.refresh(current_user)
    total_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(Expense.user_id == current_user.id)
        .scalar()
    ) or 0.0
    return BalanceOut(
        balance=current_user.balance,
        total_expenses=total_expenses,
        current_balance=current_user.balance - total_expenses,
    )
