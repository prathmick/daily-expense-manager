# Implementation Plan: Daily Expense Manager

## Overview

Incremental implementation of the full-stack Daily Expense Manager: FastAPI backend with SQLite/SQLAlchemy, JWT auth, expense CRUD, reporting, budget alerts, and a React SPA frontend. Each task builds on the previous, ending with full integration.

## Tasks

- [x] 1. Project scaffolding and database setup
  - Create `backend/` directory with `main.py`, `database.py`, `models.py`, `schemas.py`, `config.py`
  - Define all SQLAlchemy ORM models: `User`, `Expense`, `Budget`, `Category`, `RefreshToken`
  - Implement `database.py` with SQLite engine, `SessionLocal`, and `Base`
  - Seed `categories` table with Food, Travel, Shopping, Bills, Others on startup
  - Create `frontend/` with Vite + React scaffold, install Axios and React Router
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ] 2. Authentication — backend
  - [x] 2.1 Implement `UserCreate`, `UserOut`, `TokenResponse` Pydantic schemas and `CategoryEnum`
    - Add `min_length=8` validator on `UserCreate.password`
    - _Requirements: 1.1, 1.3_

  - [x] 2.2 Implement `AuthService`: `register_user`, `authenticate_user`, `create_tokens`, `refresh_access_token`, `revoke_refresh_token`
    - Use `bcrypt` for password hashing; store only `password_hash`
    - Store hashed refresh token in `refresh_tokens` table with `expires_at` and `revoked` flag
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.5_

  - [x] 2.3 Implement JWT middleware / dependency `get_current_user`
    - Validate signature, expiry, and user existence; raise 401 on failure
    - _Requirements: 2.4_

  - [x] 2.4 Implement `/auth` router: `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`
    - Return 409 on duplicate email, 401 on bad credentials
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.5_

  - [ ]* 2.5 Write property tests for auth (Properties 1–8)
    - **Property 1: Valid registration creates a user** — Validates: Requirements 1.1
    - **Property 2: Duplicate email registration is rejected** — Validates: Requirements 1.2
    - **Property 3: Short password registration is rejected** — Validates: Requirements 1.3
    - **Property 4: Passwords are stored as bcrypt hashes** — Validates: Requirements 1.4
    - **Property 5: Invalid credentials are rejected with 401** — Validates: Requirements 2.2, 2.3
    - **Property 6: JWT access token has correct expiry** — Validates: Requirements 2.1
    - **Property 7: Invalid or expired JWT is rejected** — Validates: Requirements 2.4
    - **Property 8: Logout invalidates the refresh token** — Validates: Requirements 2.5
    - File: `backend/tests/test_auth_properties.py`

- [x] 3. Checkpoint — auth layer
  - Ensure all auth tests pass, ask the user if questions arise.

- [ ] 4. Expense CRUD — backend
  - [x] 4.1 Implement `ExpenseCreate`, `ExpenseOut`, `ExpenseUpdate` Pydantic schemas
    - Validate `amount > 0`, `category` in `CategoryEnum`, `date` as ISO 8601
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 4.2 Implement `ExpenseService`: `create_expense`, `list_expenses`, `update_expense`, `delete_expense`
    - Enforce ownership check (403) and existence check (404) on update/delete
    - Apply `start_date`/`end_date` filter with 422 on invalid range; order by `date` DESC
    - Apply case-insensitive keyword substring filter and exact category filter
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4_

  - [x] 4.3 Implement `/expenses` router: `GET /expenses`, `POST /expenses`, `PUT /expenses/{id}`, `DELETE /expenses/{id}`
    - Wire `get_current_user` dependency on all routes; return 401 if unauthenticated
    - _Requirements: 3.5, 4.1, 5.1_

  - [ ]* 4.4 Write property tests for expense CRUD (Properties 9–13)
    - **Property 9: Valid expense creation round-trip** — Validates: Requirements 3.1
    - **Property 10: Invalid expense fields are rejected with 422** — Validates: Requirements 3.2, 3.3, 3.4, 4.4
    - **Property 11: Cross-user expense access is forbidden** — Validates: Requirements 4.2, 5.2
    - **Property 12: Non-existent expense returns 404** — Validates: Requirements 4.3, 5.3
    - **Property 13: Expense deletion removes the record** — Validates: Requirements 5.1
    - File: `backend/tests/test_expense_properties.py`

- [ ] 5. Dashboard aggregation — backend
  - [x] 5.1 Implement aggregation helpers in `ReportService`: daily total, weekly total, monthly total, category breakdown with percentage, 30-day daily totals array
    - Weekly period: Monday–Sunday; zero-fill days with no expenses in 30-day array
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2_

  - [x] 5.2 Add `GET /reports/dashboard` endpoint returning summary cards + 30-day array + monthly category breakdown
    - _Requirements: 6.1, 6.2, 7.1, 7.2_

  - [ ]* 5.3 Write property tests for dashboard aggregation (Properties 14–16)
    - **Property 14: Expense aggregation correctness** — Validates: Requirements 6.1
    - **Property 15: Category breakdown sums to total** — Validates: Requirements 6.2
    - **Property 16: 30-day daily totals aggregation** — Validates: Requirements 7.1
    - File: `backend/tests/test_dashboard_properties.py`

  - [ ]* 5.4 Write property tests for filter and search (Properties 17–19)
    - **Property 17: Date range filter returns only in-range expenses, ordered descending** — Validates: Requirements 8.1, 8.3
    - **Property 18: Invalid date range is rejected** — Validates: Requirements 8.2
    - **Property 19: Search filters return only matching expenses** — Validates: Requirements 9.1, 9.2, 9.3
    - File: `backend/tests/test_filter_properties.py`

- [ ] 6. Monthly reports and export — backend
  - [x] 6.1 Implement `MonthlyReportOut`, `CategorySummary` schemas
    - Validate `month` in [1, 12] and `year` > 0; return 422 otherwise
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 6.2 Implement `ReportService.monthly_report` and `ReportService.export_expenses`
    - CSV export: one row per expense with columns date, category, amount, description
    - PDF export: formatted table + category totals summary using `reportlab` or `fpdf2`
    - Return 422 for unknown format values
    - _Requirements: 10.1, 10.2, 11.1, 11.2, 11.3, 11.4_

  - [x] 6.3 Implement `/reports` router: `GET /reports/monthly`, `GET /reports/export`
    - Set correct `Content-Disposition` and `Content-Type` headers for file downloads
    - _Requirements: 11.1, 11.2_

  - [ ]* 6.4 Write property tests for reports (Properties 20–23)
    - **Property 20: Monthly report totals are correct** — Validates: Requirements 10.1
    - **Property 21: Invalid month/year is rejected** — Validates: Requirements 10.3
    - **Property 22: CSV export round-trip** — Validates: Requirements 11.1
    - **Property 23: Invalid export format is rejected** — Validates: Requirements 11.3
    - File: `backend/tests/test_report_properties.py`

- [ ] 7. Budget alerts — backend
  - [x] 7.1 Implement `BudgetSet`, `BudgetOut` schemas and `BudgetService`: `set_budget`, `list_budgets`, `evaluate_thresholds`
    - Upsert budget on (user_id, category); enforce `monthly_limit > 0`
    - `evaluate_thresholds` returns alert type (none / warning / over-budget) based on 80% and 100% thresholds
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 7.2 Call `BudgetService.evaluate_thresholds` inside `ExpenseService.create_expense` and attach alert to response when triggered
    - _Requirements: 13.2, 13.3_

  - [x] 7.3 Implement `/budgets` router: `GET /budgets`, `POST /budgets`
    - Include `current_spending` in `BudgetOut` by querying current-month totals
    - _Requirements: 13.1, 13.4_

  - [ ]* 7.4 Write property tests for budget alerts (Property 24)
    - **Property 24: Budget threshold alerts are generated correctly** — Validates: Requirements 13.2, 13.3
    - File: `backend/tests/test_budget_properties.py`

- [ ] 8. Error handling and API consistency — backend
  - [x] 8.1 Register global exception handler and override FastAPI's default 422/404 handlers to return `{"status_code": ..., "detail": ...}` envelope
    - _Requirements: 16.1, 16.2, 16.3_

  - [ ]* 8.2 Write property test for error response schema (Property 25)
    - **Property 25: Error responses conform to the standard schema** — Validates: Requirements 16.2
    - File: `backend/tests/test_error_properties.py`

  - [ ]* 8.3 Write integration tests covering full request/response cycles, refresh token flow, cascade deletes, and unique constraint on budgets
    - File: `backend/tests/test_integration.py`

  - [ ]* 8.4 Write smoke tests verifying all DB tables, columns, indexes, and constraints exist
    - File: `backend/tests/test_smoke.py`

- [x] 9. Checkpoint — backend complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [ ] 10. Frontend — Auth context and API client
  - [x] 10.1 Create `AuthContext` with `user`, `token`, `login()`, `logout()` and wrap app in provider
    - Store JWT in `localStorage`; expose via `useAuth` hook
    - _Requirements: 2.1_

  - [x] 10.2 Create `apiClient` (Axios instance) with base URL and `Authorization: Bearer` interceptor
    - Add response interceptor: on 401, attempt one token refresh via `POST /auth/refresh`; on failure, call `logout()`
    - _Requirements: 2.4_

  - [x] 10.3 Implement `AuthPage` with registration and login forms
    - Display inline validation errors adjacent to fields within 100ms of blur
    - On successful login, redirect to Dashboard
    - _Requirements: 1.1, 1.3, 12.3_

- [ ] 11. Frontend — Expense list and form
  - [x] 11.1 Implement `ExpenseListPage` with paginated table, date-range pickers, keyword input, and category dropdown
    - Wire filters to `GET /expenses` query params; display empty-state message when list is empty
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4_

  - [x] 11.2 Implement `ExpenseFormModal` for create and edit
    - Validate amount > 0, category required, date required, description ≤ 255 chars inline
    - On submit call `POST /expenses` or `PUT /expenses/{id}`; close modal and refresh list on success
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.4_

  - [x] 11.3 Wire delete button to `DELETE /expenses/{id}` with confirmation prompt; refresh list on success
    - _Requirements: 5.1_

- [ ] 12. Frontend — Dashboard
  - [x] 12.1 Implement `DashboardPage` summary cards (today / week / month totals) and category breakdown list
    - Show zero total and descriptive message when no expenses exist
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 12.2 Render bar chart (30-day daily totals) and pie chart (monthly category distribution) using Recharts or Chart.js
    - Show empty-state message when all values are zero
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 12.3 Display budget progress bars on Dashboard when budgets are set (current spending vs. limit per category)
    - _Requirements: 13.4_

- [ ] 13. Frontend — Reports and Budget pages
  - [x] 13.1 Implement `ReportPage` with year/month selectors, summary table, and Export CSV / Export PDF buttons
    - Trigger `GET /reports/monthly` on selection change; trigger `GET /reports/export` on button click with correct `format` param
    - _Requirements: 10.1, 10.2, 11.1, 11.2_

  - [x] 13.2 Implement `BudgetPage` with per-category limit inputs and progress bars
    - Submit `POST /budgets` on save; fetch and display `GET /budgets` on load
    - _Requirements: 13.1, 13.4_

- [ ] 14. Frontend — Navigation and responsive layout
  - [x] 14.1 Implement `NavBar` with links to Dashboard, Expenses, Reports, Budgets, and Logout
    - Collapse to hamburger menu below 768px using CSS media queries
    - _Requirements: 12.1, 12.2_

  - [x] 14.2 Apply responsive CSS layout across all pages (320px, 768px, 1280px breakpoints, no horizontal scroll)
    - _Requirements: 12.1_

- [ ] 15. Frontend — Component tests
  - [ ]* 15.1 Write React Testing Library unit tests for `AuthPage` form validation and submission
    - Mock API with `msw`; assert inline error display on blur
    - _Requirements: 1.1, 1.3, 12.3_

  - [ ]* 15.2 Write snapshot tests for bar chart and pie chart components
    - _Requirements: 7.1, 7.2_

  - [ ]* 15.3 Write unit tests for `ExpenseFormModal` validation logic
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 16. Final checkpoint — full stack integration
  - Ensure all backend and frontend tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use Hypothesis (`@given`, `@settings(max_examples=100)`) and are tagged with `# Feature: daily-expense-manager, Property N: ...`
- Checkpoints ensure incremental validation before moving to the next layer
