from datetime import date
from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Budget, Expense
from schemas import BudgetSet


class BudgetService:

    def set_budget(self, db: Session, user_id: int, budget_in: BudgetSet) -> Budget:
        """Upsert budget for (user_id, category). monthly_limit > 0 enforced by schema."""
        existing = (
            db.query(Budget)
            .filter(Budget.user_id == user_id, Budget.category == budget_in.category)
            .first()
        )
        if existing:
            existing.monthly_limit = budget_in.monthly_limit
            db.commit()
            db.refresh(existing)
            return existing

        budget = Budget(
            user_id=user_id,
            category=budget_in.category,
            monthly_limit=budget_in.monthly_limit,
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return budget

    def list_budgets(self, db: Session, user_id: int) -> list[Budget]:
        """Return all budgets for the given user."""
        return db.query(Budget).filter(Budget.user_id == user_id).all()

    def get_current_spending(self, db: Session, user_id: int, category: str) -> float:
        """Get current month's total spending for user in the given category."""
        today = date.today()
        result = (
            db.query(func.sum(Expense.amount))
            .filter(
                Expense.user_id == user_id,
                Expense.category == category,
                func.strftime("%Y", Expense.date) == str(today.year),
                func.strftime("%m", Expense.date) == f"{today.month:02d}",
            )
            .scalar()
        )
        return result or 0.0

    def evaluate_thresholds(self, db: Session, user_id: int, category: str) -> str:
        """
        Returns alert type based on current month's spending vs budget limit:
          - "none"        if no budget is set, or spending < 80% of limit
          - "warning"     if spending >= 80% of limit
          - "over-budget" if spending >= 100% of limit
        """
        budget = (
            db.query(Budget)
            .filter(Budget.user_id == user_id, Budget.category == category)
            .first()
        )
        if budget is None:
            return "none"

        spending = self.get_current_spending(db, user_id, category)
        limit = budget.monthly_limit

        if spending >= limit:
            return "over-budget"
        if spending >= limit * 0.8:
            return "warning"
        return "none"

    def get_budget_with_spending(self, db: Session, user_id: int, category: str) -> dict:
        """Return budget info plus current_spending for BudgetOut serialization."""
        budget = (
            db.query(Budget)
            .filter(Budget.user_id == user_id, Budget.category == category)
            .first()
        )
        if budget is None:
            return {}
        spending = self.get_current_spending(db, user_id, category)
        return {
            "id": budget.id,
            "user_id": budget.user_id,
            "category": budget.category,
            "monthly_limit": budget.monthly_limit,
            "current_spending": spending,
            "updated_at": budget.updated_at,
        }


budget_service = BudgetService()
