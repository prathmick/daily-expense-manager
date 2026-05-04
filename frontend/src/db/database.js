import Dexie from "dexie";

export const db = new Dexie("ExpenseManagerDB");

db.version(1).stores({
  settings: "key",          // key-value store: balance, monthly_salary, profile
  expenses: "++id, date, category, created_at",
  budgets:  "++id, &category",  // unique category
});

// ── Settings helpers ──────────────────────────────────────────────────────────

export async function getSetting(key, defaultValue = null) {
  const row = await db.settings.get(key);
  return row ? row.value : defaultValue;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}
