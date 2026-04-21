import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { fmt } from "../utils/currency";

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Others"];

function ProgressBar({ current, limit }) {
  const pct = Math.min((current / limit) * 100, 100);
  const barColor = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f97316" : "#10b981";
  return (
    <div style={{ marginTop: "10px" }}>
      <div
        style={{
          height: "10px",
          background: "#f1f5f9",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: barColor,
            borderRadius: "999px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
        {fmt(current)} spent of {fmt(limit)} limit
      </div>
    </div>
  );
}

function CategoryRow({ category, budget, onSaved }) {
  const [limit, setLimit] = useState(budget ? String(budget.monthly_limit) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLimit(budget ? String(budget.monthly_limit) : "");
  }, [budget]);

  const handleSave = async () => {
    const parsed = parseFloat(limit);
    if (!limit || isNaN(parsed) || parsed < 0.01) {
      setError("Enter a valid limit (min 0.01)");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await apiClient.post("/budgets", { category, monthly_limit: parsed });
      onSaved();
    } catch {
      setError("Failed to save budget.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "20px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <span
          style={{
            fontWeight: 600,
            color: "#1e293b",
            fontSize: "15px",
            minWidth: "90px",
          }}
        >
          {category}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <span style={{ color: "#64748b", fontSize: "13px" }}>Monthly limit ₹</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="0.00"
            style={{
              width: "120px",
              padding: "7px 10px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "7px 18px",
            background: saving ? "#94a3b8" : "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {error && (
        <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>{error}</div>
      )}
      {budget && (
        <ProgressBar current={budget.current_spending} limit={budget.monthly_limit} />
      )}
    </div>
  );
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const loadBudgets = () => {
    setLoading(true);
    apiClient
      .get("/budgets")
      .then((res) => setBudgets(res.data))
      .catch(() => setFetchError("Failed to load budgets."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const getBudgetForCategory = (category) =>
    budgets.find((b) => b.category === category) || null;

  if (loading) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
        Loading budgets...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
        {fetchError}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
        Budget Settings
      </h1>
      <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
        Set monthly spending limits per category.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {CATEGORIES.map((cat) => (
          <CategoryRow
            key={cat}
            category={cat}
            budget={getBudgetForCategory(cat)}
            onSaved={loadBudgets}
          />
        ))}
      </div>
    </div>
  );
}
