from datetime import datetime, date as date_type
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models import Expense
from schemas import ExpenseCreate, ExpenseUpdate


class ExpenseService:

    def create_expense(
        self,
        db: Session,
        user_id: int,
        expense_in: ExpenseCreate,
        budget_service=None,
    ) -> tuple:
        expense = Expense(
            user_id=user_id,
            amount=expense_in.amount,
            category=expense_in.category.value,
            date=expense_in.date,
            description=expense_in.description,
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        alert = "none"
        if budget_service is not None:
            alert = budget_service.evaluate_thresholds(db, user_id, expense_in.category.value)
        return expense, alert

    def list_expenses(
        self,
        db: Session,
        user_id: int,
        start_date: Optional[date_type] = None,
        end_date: Optional[date_type] = None,
        keyword: Optional[str] = None,
        category: Optional[str] = None,
    ) -> list[Expense]:
        if start_date is not None and end_date is not None:
            if start_date > end_date:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="start_date must be on or before end_date",
                )

        query = db.query(Expense).filter(Expense.user_id == user_id)

        if start_date is not None:
            query = query.filter(Expense.date >= start_date)
        if end_date is not None:
            query = query.filter(Expense.date <= end_date)
        if keyword is not None:
            query = query.filter(Expense.description.ilike(f"%{keyword}%"))
        if category is not None:
            query = query.filter(Expense.category == category)

        return query.order_by(Expense.date.desc()).all()

    def update_expense(
        self,
        db: Session,
        user_id: int,
        expense_id: int,
        expense_in: ExpenseUpdate,
    ) -> Expense:
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if expense is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found",
            )
        if expense.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this expense",
            )

        update_data = expense_in.model_dump(exclude_unset=True, exclude_none=False)
        for field, value in update_data.items():
            # Store enum value as string
            if hasattr(value, "value"):
                value = value.value
            setattr(expense, field, value)

        expense.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(expense)
        return expense

    def delete_expense(
        self,
        db: Session,
        user_id: int,
        expense_id: int,
    ) -> None:
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if expense is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found",
            )
        if expense.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this expense",
            )

        db.delete(expense)
        db.commit()


expense_service = ExpenseService()
