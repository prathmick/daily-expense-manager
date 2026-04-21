# Requirements Document

## Introduction

The Daily Expense Manager is a full-stack web application that enables users to track, manage, and analyze their personal daily expenses. The system provides secure user authentication, comprehensive expense CRUD operations, visual dashboards with charts, filtering and search capabilities, monthly reports with export functionality, and optional features such as budget alerts, dark mode, and reminders. The frontend is built with React (HTML/CSS), the backend with FastAPI (Python), and data is persisted in SQLite.

## Glossary

- **System**: The Daily Expense Manager application as a whole.
- **Auth_Service**: The backend component responsible for user registration, login, and JWT token management.
- **Expense_Service**: The backend component responsible for creating, reading, updating, and deleting expense records.
- **Dashboard**: The frontend component that displays aggregated expense summaries and charts.
- **Report_Service**: The backend component responsible for generating monthly summaries and exporting data.
- **Budget_Service**: The backend component responsible for managing budget limits and evaluating alert thresholds.
- **Notification_Service**: The component responsible for delivering in-app reminders to users.
- **User**: A registered individual who interacts with the System.
- **Expense**: A financial transaction record containing amount, category, date, and description.
- **Category**: A classification label for an expense — one of: Food, Travel, Shopping, Bills, Others.
- **JWT**: JSON Web Token used to authenticate API requests.
- **CSV**: Comma-Separated Values file format for data export.
- **PDF**: Portable Document Format file for data export.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a new visitor, I want to create an account, so that I can securely store and access my personal expense data.

#### Acceptance Criteria

1. WHEN a registration request is submitted with a unique email, a valid password of at least 8 characters, and a display name, THE Auth_Service SHALL create a new User record and return a 201 response.
2. WHEN a registration request is submitted with an email that already exists in the database, THE Auth_Service SHALL return a 409 response with a descriptive error message.
3. WHEN a registration request is submitted with a password shorter than 8 characters, THE Auth_Service SHALL return a 422 response with a descriptive validation error.
4. THE Auth_Service SHALL store User passwords as bcrypt hashes and SHALL NOT store plaintext passwords.

---

### Requirement 2: User Login and Session Management

**User Story:** As a registered user, I want to log in with my credentials, so that I can access my expense data securely.

#### Acceptance Criteria

1. WHEN a login request is submitted with a valid email and correct password, THE Auth_Service SHALL return a signed JWT access token with an expiry of 60 minutes and a refresh token with an expiry of 7 days.
2. WHEN a login request is submitted with a valid email and an incorrect password, THE Auth_Service SHALL return a 401 response with a descriptive error message.
3. WHEN a login request is submitted with an email that does not exist, THE Auth_Service SHALL return a 401 response with a descriptive error message.
4. WHEN an API request is received with an expired or invalid JWT, THE Auth_Service SHALL return a 401 response.
5. WHEN a logout request is received with a valid JWT, THE Auth_Service SHALL invalidate the associated refresh token.

---

### Requirement 3: Add Expense

**User Story:** As an authenticated user, I want to add a new expense record, so that I can track my daily spending.

#### Acceptance Criteria

1. WHEN an authenticated create-expense request is received containing a positive numeric amount, a valid Category, a date in ISO 8601 format, and an optional description of at most 255 characters, THE Expense_Service SHALL persist the Expense record and return a 201 response with the created record.
2. WHEN a create-expense request is received with a non-positive amount, THE Expense_Service SHALL return a 422 response with a descriptive validation error.
3. WHEN a create-expense request is received with a Category value not in {Food, Travel, Shopping, Bills, Others}, THE Expense_Service SHALL return a 422 response with a descriptive validation error.
4. WHEN a create-expense request is received with a date that is not in ISO 8601 format, THE Expense_Service SHALL return a 422 response with a descriptive validation error.
5. IF a create-expense request is received without a valid JWT, THEN THE Expense_Service SHALL return a 401 response.

---

### Requirement 4: Edit Expense

**User Story:** As an authenticated user, I want to edit an existing expense, so that I can correct mistakes in my records.

#### Acceptance Criteria

1. WHEN an authenticated update-expense request is received for an Expense owned by the requesting User, THE Expense_Service SHALL update the specified fields and return a 200 response with the updated record.
2. WHEN an update-expense request is received for an Expense that does not belong to the requesting User, THE Expense_Service SHALL return a 403 response.
3. WHEN an update-expense request is received for an Expense ID that does not exist, THE Expense_Service SHALL return a 404 response.
4. WHEN an update-expense request contains an invalid field value (non-positive amount, invalid category, or malformed date), THE Expense_Service SHALL return a 422 response with a descriptive validation error.

---

### Requirement 5: Delete Expense

**User Story:** As an authenticated user, I want to delete an expense, so that I can remove incorrect or duplicate records.

#### Acceptance Criteria

1. WHEN an authenticated delete-expense request is received for an Expense owned by the requesting User, THE Expense_Service SHALL delete the record and return a 204 response.
2. WHEN a delete-expense request is received for an Expense that does not belong to the requesting User, THE Expense_Service SHALL return a 403 response.
3. WHEN a delete-expense request is received for an Expense ID that does not exist, THE Expense_Service SHALL return a 404 response.

---

### Requirement 6: Dashboard — Expense Summaries

**User Story:** As an authenticated user, I want to view my total expenses for different time periods, so that I can understand my spending patterns at a glance.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded for an authenticated User, THE Dashboard SHALL display the total expense amount for the current calendar day, the current calendar week (Monday–Sunday), and the current calendar month.
2. WHEN the Dashboard is loaded for an authenticated User, THE Dashboard SHALL display a category-wise breakdown showing the total amount and percentage share for each Category that has at least one Expense in the current month.
3. WHEN the Dashboard is loaded and the authenticated User has no Expenses for the selected period, THE Dashboard SHALL display a zero total and an empty breakdown with a descriptive message.

---

### Requirement 7: Dashboard — Charts

**User Story:** As an authenticated user, I want to see visual charts of my expenses, so that I can quickly identify spending trends.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded for an authenticated User, THE Dashboard SHALL render a bar chart showing daily expense totals for the last 30 days.
2. WHEN the Dashboard is loaded for an authenticated User, THE Dashboard SHALL render a pie chart showing the category-wise expense distribution for the current month.
3. WHEN chart data contains zero expenses for all categories, THE Dashboard SHALL display a descriptive empty-state message in place of the chart.

---

### Requirement 8: Filter Expenses by Date Range

**User Story:** As an authenticated user, I want to filter my expenses by a date range, so that I can review spending for a specific period.

#### Acceptance Criteria

1. WHEN an authenticated list-expenses request is received with a valid start date and end date in ISO 8601 format, THE Expense_Service SHALL return all Expenses for the requesting User whose date falls within the inclusive range, ordered by date descending.
2. WHEN a list-expenses request is received with a start date that is after the end date, THE Expense_Service SHALL return a 422 response with a descriptive validation error.
3. WHEN a list-expenses request is received without date filters, THE Expense_Service SHALL return all Expenses for the requesting User ordered by date descending.

---

### Requirement 9: Search Expenses

**User Story:** As an authenticated user, I want to search my expenses by keyword or category, so that I can quickly locate specific records.

#### Acceptance Criteria

1. WHEN an authenticated list-expenses request is received with a non-empty keyword parameter, THE Expense_Service SHALL return all Expenses for the requesting User whose description contains the keyword (case-insensitive).
2. WHEN an authenticated list-expenses request is received with a category parameter containing a valid Category value, THE Expense_Service SHALL return all Expenses for the requesting User that match the specified Category.
3. WHEN an authenticated list-expenses request is received with both a keyword and a category parameter, THE Expense_Service SHALL return Expenses that satisfy both filters simultaneously.
4. WHEN a search returns no matching Expenses, THE Expense_Service SHALL return a 200 response with an empty list.

---

### Requirement 10: Monthly Summary Report

**User Story:** As an authenticated user, I want to view a monthly summary of my expenses, so that I can review my total spending and category breakdown for any past month.

#### Acceptance Criteria

1. WHEN an authenticated monthly-report request is received with a valid year and month, THE Report_Service SHALL return the total expense amount, the count of Expenses, and a category-wise breakdown for the requesting User for that month.
2. WHEN a monthly-report request is received for a month with no Expenses, THE Report_Service SHALL return a 200 response with zero totals and an empty category breakdown.
3. WHEN a monthly-report request is received with an invalid year or month value, THE Report_Service SHALL return a 422 response with a descriptive validation error.

---

### Requirement 11: Export Expense Data

**User Story:** As an authenticated user, I want to export my expense data to CSV or PDF, so that I can keep offline records or share them.

#### Acceptance Criteria

1. WHEN an authenticated export request is received with format=csv and an optional date range, THE Report_Service SHALL return a downloadable CSV file containing all matching Expenses for the requesting User with columns: date, category, amount, description.
2. WHEN an authenticated export request is received with format=pdf and an optional date range, THE Report_Service SHALL return a downloadable PDF file containing a formatted table of all matching Expenses and a summary section with totals per category.
3. WHEN an export request is received with a format value other than csv or pdf, THE Report_Service SHALL return a 422 response with a descriptive validation error.
4. WHEN an export request is received for a date range with no matching Expenses, THE Report_Service SHALL return an empty CSV or a PDF with a descriptive empty-state message.

---

### Requirement 12: Responsive and Accessible UI

**User Story:** As a user on any device, I want the interface to adapt to my screen size, so that I can manage expenses comfortably on desktop or mobile.

#### Acceptance Criteria

1. THE System SHALL render all pages using a responsive CSS layout that adapts to viewport widths of 320px, 768px, and 1280px without horizontal scrolling.
2. THE System SHALL display a navigation menu that collapses into a hamburger menu on viewport widths below 768px.
3. THE System SHALL provide form validation feedback inline, adjacent to the relevant input field, within 100ms of the user leaving the field.

---

### Requirement 13: Budget Setting and Alerts (Optional)

**User Story:** As an authenticated user, I want to set a monthly budget for each category, so that I receive an alert when I am approaching or exceeding my limit.

#### Acceptance Criteria

1. WHERE budget alerts are enabled, WHEN an authenticated set-budget request is received with a valid Category and a positive numeric limit, THE Budget_Service SHALL persist the budget record for the requesting User and return a 200 response.
2. WHERE budget alerts are enabled, WHEN a new Expense is created and the User's total spending in the Expense's Category for the current month reaches 80% of the budget limit, THE Budget_Service SHALL generate an alert notification for the User.
3. WHERE budget alerts are enabled, WHEN a new Expense is created and the User's total spending in the Expense's Category for the current month exceeds 100% of the budget limit, THE Budget_Service SHALL generate an over-budget alert notification for the User.
4. WHERE budget alerts are enabled, WHEN the Dashboard is loaded, THE Dashboard SHALL display the current spending amount and budget limit for each Category that has a budget set.

---





---

### Requirement 15: Expense Reminders / Notifications (Optional)

**User Story:** As a user, I want to receive reminders to log my expenses, so that I do not forget to record my daily spending.

#### Acceptance Criteria

1. WHERE notifications are enabled, WHEN the User has not added any Expense for the current calendar day by 20:00 local time, THE Notification_Service SHALL display an in-app reminder prompting the User to log expenses.
2. WHERE notifications are enabled, WHEN the User dismisses a reminder, THE Notification_Service SHALL not display another reminder for the same calendar day.

---

### Requirement 16: REST API Error Handling

**User Story:** As a developer integrating with the API, I want consistent and descriptive error responses, so that I can handle failures gracefully in the frontend.

#### Acceptance Criteria

1. IF an unhandled exception occurs during request processing, THEN THE System SHALL return a 500 response with a JSON body containing a descriptive error message and SHALL log the full stack trace server-side.
2. THE System SHALL return all error responses as JSON objects with at minimum the fields: `status_code` (integer), `detail` (string).
3. WHEN a request is received for a route that does not exist, THE System SHALL return a 404 response with a JSON body conforming to the standard error schema.

---

### Requirement 17: Database Schema and Integrity

**User Story:** As a developer, I want a well-structured database schema with proper relationships and indexing, so that queries are efficient and data integrity is maintained.

#### Acceptance Criteria

1. THE System SHALL maintain a `users` table with columns: id (primary key), email (unique, indexed), display_name, password_hash, created_at.
2. THE System SHALL maintain an `expenses` table with columns: id (primary key), user_id (foreign key → users.id), category, amount, date (indexed), description, created_at, updated_at.
3. THE System SHALL maintain a `categories` table seeded with the values: Food, Travel, Shopping, Bills, Others.
4. THE System SHALL maintain a `budgets` table with columns: id (primary key), user_id (foreign key → users.id), category, monthly_limit, created_at, updated_at.
5. THE System SHALL enforce a foreign key constraint between `expenses.user_id` and `users.id` such that deleting a User cascades to delete all associated Expenses and Budgets.
6. THE System SHALL enforce a unique constraint on (user_id, category) in the `budgets` table.
