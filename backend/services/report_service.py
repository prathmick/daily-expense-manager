import csv
import io
from datetime import date, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException

from models import Expense
from schemas import CategorySummary, MonthlyReportOut


class ReportService:

    def get_daily_total(self, db: Session, user_id: int, target_date: date) -> float:
        result = (
            db.query(func.sum(Expense.amount))
            .filter(Expense.user_id == user_id, Expense.date == target_date)
            .scalar()
        )
        return result or 0.0

    def get_weekly_total(self, db: Session, user_id: int, target_date: date) -> float:
        # Monday–Sunday week containing target_date
        week_start = target_date - timedelta(days=target_date.weekday())  # Monday
        week_end = week_start + timedelta(days=6)  # Sunday
        result = (
            db.query(func.sum(Expense.amount))
            .filter(
                Expense.user_id == user_id,
                Expense.date >= week_start,
                Expense.date <= week_end,
            )
            .scalar()
        )
        return result or 0.0

    def get_monthly_total(self, db: Session, user_id: int, year: int, month: int) -> float:
        result = (
            db.query(func.sum(Expense.amount))
            .filter(
                Expense.user_id == user_id,
                func.strftime("%Y", Expense.date) == str(year),
                func.strftime("%m", Expense.date) == f"{month:02d}",
            )
            .scalar()
        )
        return result or 0.0

    def get_category_breakdown(
        self, db: Session, user_id: int, year: int, month: int
    ) -> list[CategorySummary]:
        rows = (
            db.query(Expense.category, func.sum(Expense.amount).label("total"))
            .filter(
                Expense.user_id == user_id,
                func.strftime("%Y", Expense.date) == str(year),
                func.strftime("%m", Expense.date) == f"{month:02d}",
            )
            .group_by(Expense.category)
            .all()
        )

        if not rows:
            return []

        month_total = sum(row.total for row in rows)
        return [
            CategorySummary(
                category=row.category,
                total=row.total,
                percentage=(row.total / month_total * 100) if month_total else 0.0,
            )
            for row in rows
        ]

    def get_30day_daily_totals(
        self, db: Session, user_id: int, reference_date: date
    ) -> list[dict]:
        start_date = reference_date - timedelta(days=29)  # 30 days inclusive

        rows = (
            db.query(Expense.date, func.sum(Expense.amount).label("total"))
            .filter(
                Expense.user_id == user_id,
                Expense.date >= start_date,
                Expense.date <= reference_date,
            )
            .group_by(Expense.date)
            .all()
        )

        totals_by_date = {row.date: row.total for row in rows}

        return [
            {
                "date": (start_date + timedelta(days=i)).isoformat(),
                "total": totals_by_date.get(start_date + timedelta(days=i), 0.0),
            }
            for i in range(30)
        ]

    def get_dashboard_data(self, db: Session, user_id: int) -> dict:
        today = date.today()
        return {
            "today_total": self.get_daily_total(db, user_id, today),
            "week_total": self.get_weekly_total(db, user_id, today),
            "month_total": self.get_monthly_total(db, user_id, today.year, today.month),
            "category_breakdown": self.get_category_breakdown(
                db, user_id, today.year, today.month
            ),
            "daily_totals_30d": self.get_30day_daily_totals(db, user_id, today),
        }


    def monthly_report(
        self, db: Session, user_id: int, year: int, month: int
    ) -> MonthlyReportOut:
        if year <= 0 or month < 1 or month > 12:
            raise HTTPException(status_code=422, detail="Invalid year or month")

        total_amount = self.get_monthly_total(db, user_id, year, month)
        category_breakdown = self.get_category_breakdown(db, user_id, year, month)

        expense_count = (
            db.query(func.count(Expense.id))
            .filter(
                Expense.user_id == user_id,
                func.strftime("%Y", Expense.date) == str(year),
                func.strftime("%m", Expense.date) == f"{month:02d}",
            )
            .scalar()
        ) or 0

        return MonthlyReportOut(
            year=year,
            month=month,
            total_amount=total_amount,
            expense_count=expense_count,
            category_breakdown=category_breakdown,
        )

    def export_expenses(
        self,
        db: Session,
        user_id: int,
        format: str,
        start_date=None,
        end_date=None,
    ) -> tuple[bytes, str]:
        if format not in ("csv", "pdf"):
            raise HTTPException(status_code=422, detail="format must be 'csv' or 'pdf'")

        query = db.query(Expense).filter(Expense.user_id == user_id)
        if start_date is not None:
            query = query.filter(Expense.date >= start_date)
        if end_date is not None:
            query = query.filter(Expense.date <= end_date)
        expenses = query.order_by(Expense.date).all()

        if format == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["date", "category", "amount", "description"])
            for e in expenses:
                writer.writerow([e.date, e.category, e.amount, e.description or ""])
            return output.getvalue().encode("utf-8"), "text/csv"

        # PDF
        from fpdf import FPDF

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Expense Report", ln=True, align="C")
        pdf.ln(4)

        if not expenses:
            pdf.set_font("Helvetica", "", 12)
            pdf.cell(0, 10, "No expenses found", ln=True)
            return bytes(pdf.output()), "application/pdf"

        # Table header
        col_widths = [30, 35, 30, 95]
        headers = ["Date", "Category", "Amount", "Description"]
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_fill_color(200, 200, 200)
        for header, w in zip(headers, col_widths):
            pdf.cell(w, 8, header, border=1, fill=True)
        pdf.ln()

        # Table rows
        pdf.set_font("Helvetica", "", 10)
        category_totals: dict[str, float] = {}
        for e in expenses:
            pdf.cell(col_widths[0], 7, str(e.date), border=1)
            pdf.cell(col_widths[1], 7, e.category, border=1)
            pdf.cell(col_widths[2], 7, f"{e.amount:.2f}", border=1)
            desc = (e.description or "")[:50]
            pdf.cell(col_widths[3], 7, desc, border=1)
            pdf.ln()
            category_totals[e.category] = category_totals.get(e.category, 0.0) + e.amount

        # Summary section
        pdf.ln(6)
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "Category Totals", ln=True)
        pdf.set_font("Helvetica", "", 10)
        for cat, total in sorted(category_totals.items()):
            pdf.cell(60, 7, cat, border=1)
            pdf.cell(40, 7, f"{total:.2f}", border=1)
            pdf.ln()

        return bytes(pdf.output()), "application/pdf"


report_service = ReportService()
