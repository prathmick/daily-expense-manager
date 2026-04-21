from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User
from schemas import BudgetOut, BudgetSet
from services.budget_service import budget_service

router = APIRouter()


def _to_budget_out(db: Session, budget) -> BudgetOut:
    return BudgetOut(
        id=budget.id,
        user_id=budget.user_id,
        category=budget.category,
        monthly_limit=budget.monthly_limit,
        current_spending=budget_service.get_current_spending(db, budget.user_id, budget.category),
        updated_at=budget.updated_at,
    )


@router.get("", response_model=list[BudgetOut])
def list_budgets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budgets = budget_service.list_budgets(db, current_user.id)
    return [_to_budget_out(db, b) for b in budgets]


@router.post("", response_model=BudgetOut)
def set_budget(
    budget_in: BudgetSet,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = budget_service.set_budget(db, current_user.id, budget_in)
    return _to_budget_out(db, budget)
