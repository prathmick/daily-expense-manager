from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User
from schemas import CategoryEnum, ExpenseCreate, ExpenseCreateOut, ExpenseOut, ExpenseUpdate
from services.expense_service import expense_service
from services.budget_service import budget_service

router = APIRouter()


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    keyword: Optional[str] = Query(None),
    category: Optional[CategoryEnum] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    category_str = category.value if category is not None else None
    return expense_service.list_expenses(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        keyword=keyword,
        category=category_str,
    )


@router.post("", response_model=ExpenseCreateOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense, alert = expense_service.create_expense(
        db=db, user_id=current_user.id, expense_in=expense_in, budget_service=budget_service
    )
    return ExpenseCreateOut(**ExpenseOut.model_validate(expense).model_dump(), budget_alert=alert)


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int,
    expense_in: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return expense_service.update_expense(
        db=db,
        user_id=current_user.id,
        expense_id=expense_id,
        expense_in=expense_in,
    )


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense_service.delete_expense(db=db, user_id=current_user.id, expense_id=expense_id)
