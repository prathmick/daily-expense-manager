import { db, getSetting, setSetting } from "./database";

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Others"];

// ── Profile / Auth ────────────────────────────────────────────────────────────

export async function getProfile() {
  return getSetting("profile", null);
}

export async function saveProfile(profile) {
  await setSetting("profile", profile);
}

// ── Balance / Salary ──────────────────────────────────────────────────────────

export async function getBalanceData() {
  const balance        = await getSetting("balance", 0);
  const monthly_salary = await getSetting("monthly_salary", 0);

  const today = new Date();
  const ym    = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const allExpenses = await db.expenses.toArray();

  const total_expenses = allExpenses.reduce((s, e) => s + e.amount, 0);

  const month_expenses = allExpenses
    .filter(e => e.date && e.date.startsWith(ym))
    .reduce((s, e) => s + e.amount, 0);

  const month_remaining = monthly_salary > 0 ? monthly_salary - month_expenses : 0;

  return {
    balance,
    monthly_salary,
    total_expenses,
    current_balance: balance - total_expenses,
    month_expenses,
    month_remaining,
  };
}

export async function setBalance(value) {
  await setSetting("balance", value);
  return getBalanceData();
}

export async function setMonthlySalary(value) {
  await setSetting("monthly_salary", value);
  return getBalanceData();
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function listExpenses({ start_date, end_date, keyword, category } = {}) {
  let expenses = await db.expenses.orderBy("date").reverse().toArray();

  if (start_date) expenses = expenses.filter(e => e.date >= start_date);
  if (end_date)   expenses = expenses.filter(e => e.date <= end_date);
  if (category)   expenses = expenses.filter(e => e.category === category);
  if (keyword) {
    const kw = keyword.toLowerCase();
    expenses = expenses.filter(e => e.description && e.description.toLowerCase().includes(kw));
  }

  return expenses;
}

export async function createExpense({ amount, category, date, description }) {
  const now = new Date().toISOString();
  const id  = await db.expenses.add({
    amount: parseFloat(amount),
    category,
    date,
    description: description || null,
    created_at: now,
    updated_at: now,
  });
  const expense = await db.expenses.get(id);

  // Check budget threshold
  const budget = await db.budgets.where("category").equals(category).first();
  let budget_alert = "none";
  if (budget) {
    const today = new Date();
    const ym    = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const all   = await db.expenses.toArray();
    const monthSpend = all
      .filter(e => e.category === category && e.date && e.date.startsWith(ym))
      .reduce((s, e) => s + e.amount, 0);
    const pct = (monthSpend / budget.monthly_limit) * 100;
    if (pct >= 100) budget_alert = "over-budget";
    else if (pct >= 80) budget_alert = "warning";
  }

  return { ...expense, budget_alert };
}

export async function updateExpense(id, { amount, category, date, description }) {
  const existing = await db.expenses.get(id);
  if (!existing) throw new Error("Expense not found");

  const updates = {
    updated_at: new Date().toISOString(),
  };
  if (amount    !== undefined && amount    !== null) updates.amount      = parseFloat(amount);
  if (category  !== undefined && category  !== null) updates.category    = category;
  if (date      !== undefined && date      !== null) updates.date        = date;
  if (description !== undefined)                     updates.description = description || null;

  await db.expenses.update(id, updates);
  return db.expenses.get(id);
}

export async function deleteExpense(id) {
  await db.expenses.delete(id);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardData() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Week: Monday–Sunday
  const dayOfWeek  = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const weekStart  = new Date(today); weekStart.setDate(today.getDate() - dayOfWeek);
  const weekEnd    = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr   = weekEnd.toISOString().split("T")[0];

  const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const all = await db.expenses.toArray();

  const today_total = all.filter(e => e.date === todayStr).reduce((s, e) => s + e.amount, 0);
  const week_total  = all.filter(e => e.date >= weekStartStr && e.date <= weekEndStr).reduce((s, e) => s + e.amount, 0);
  const month_total = all.filter(e => e.date && e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);

  // Category breakdown for current month
  const monthExpenses = all.filter(e => e.date && e.date.startsWith(ym));
  const catMap = {};
  monthExpenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  const category_breakdown = Object.entries(catMap).map(([category, total]) => ({
    category,
    total,
    percentage: month_total > 0 ? (total / month_total) * 100 : 0,
  }));

  // 30-day daily totals
  const daily_totals_30d = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const total = all.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0);
    daily_totals_30d.push({ date: ds, total });
  }

  return { today_total, week_total, month_total, category_breakdown, daily_totals_30d };
}

// ── Monthly Report ────────────────────────────────────────────────────────────

export async function getMonthlyReport(year, month) {
  const ym  = `${year}-${String(month).padStart(2, "0")}`;
  const all = await db.expenses.toArray();
  const monthExpenses = all.filter(e => e.date && e.date.startsWith(ym));

  const total_amount   = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const expense_count  = monthExpenses.length;

  const catMap = {};
  monthExpenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  const category_breakdown = Object.entries(catMap).map(([category, total]) => ({
    category,
    total,
    percentage: total_amount > 0 ? (total / total_amount) * 100 : 0,
  }));

  return { year, month, total_amount, expense_count, category_breakdown };
}

// ── CSV Export ────────────────────────────────────────────────────────────────

export async function exportCSV({ start_date, end_date } = {}) {
  let expenses = await db.expenses.orderBy("date").toArray();
  if (start_date) expenses = expenses.filter(e => e.date >= start_date);
  if (end_date)   expenses = expenses.filter(e => e.date <= end_date);

  const rows = [["date", "category", "amount", "description"]];
  expenses.forEach(e => rows.push([e.date, e.category, e.amount, e.description || ""]));

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "expenses.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ── Budgets ───────────────────────────────────────────────────────────────────

export async function listBudgets() {
  const budgets = await db.budgets.toArray();
  const today   = new Date();
  const ym      = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const all     = await db.expenses.toArray();

  return budgets.map(b => {
    const current_spending = all
      .filter(e => e.category === b.category && e.date && e.date.startsWith(ym))
      .reduce((s, e) => s + e.amount, 0);
    return { ...b, current_spending };
  });
}

export async function setBudget(category, monthly_limit) {
  const existing = await db.budgets.where("category").equals(category).first();
  if (existing) {
    await db.budgets.update(existing.id, { monthly_limit, updated_at: new Date().toISOString() });
  } else {
    await db.budgets.add({ category, monthly_limit, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }
  return listBudgets();
}
