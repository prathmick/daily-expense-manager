from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User
from schemas import CategorySummary, MonthlyReportOut
from services.report_service import report_service

router = APIRouter()


class DailyTotal(BaseModel):
    date: str
    total: float


class DashboardOut(BaseModel):
    today_total: float
    week_total: float
    month_total: float
    category_breakdown: list[CategorySummary]
    daily_totals_30d: list[DailyTotal]


@router.get("/monthly", response_model=MonthlyReportOut)
def get_monthly_report(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return report_service.monthly_report(db, current_user.id, year, month)


@router.get("/export")
def export_expenses(
    format: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content, media_type = report_service.export_expenses(
        db, current_user.id, format, start_date, end_date
    )
    filename = "expenses.csv" if format == "csv" else "expenses.pdf"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/dashboard", response_model=DashboardOut)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = report_service.get_dashboard_data(db, current_user.id)
    return DashboardOut(
        today_total=data["today_total"],
        week_total=data["week_total"],
        month_total=data["month_total"],
        category_breakdown=data["category_breakdown"],
        daily_totals_30d=[DailyTotal(**d) for d in data["daily_totals_30d"]],
    )
