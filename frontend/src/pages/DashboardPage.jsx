import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import apiClient from "../api/apiClient";
import { fmt } from "../utils/currency";

const PIE_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const formatDate = (dateStr) => {
  const [, month, day] = dateStr.split("-");
  return `${month}/${day}`;
};

function SummaryCard({ title, amount }) {
  return (
    <div style={{ flex: "1 1 180px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "24px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px", fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b" }}>{fmt(amount)}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([apiClient.get("/reports/dashboard"), apiClient.get("/budgets")])
      .then(([dashRes, budgetRes]) => { setData(dashRes.data); setBudgets(budgetRes.data); })
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>{error}</div>;

  const allZero = data.today_total === 0 && data.week_total === 0 && data.month_total === 0;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1e293b", marginBottom: "24px" }}>Dashboard</h1>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "32px" }}>
        <SummaryCard title="Today" amount={data.today_total} />
        <SummaryCard title="This Week" amount={data.week_total} />
        <SummaryCard title="This Month" amount={data.month_total} />
      </div>

      {allZero && (
        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "15px", marginBottom: "32px" }}>
          No expenses yet. Add your first expense to see your spending summary.
        </div>
      )}

      {/* Category Breakdown */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "16px" }}>This Month by Category</h2>
        {data.category_breakdown.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: "14px" }}>No expenses this month.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.category_breakdown.map((item) => (
              <div key={item.category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
                <span style={{ fontWeight: 500, color: "#334155" }}>{item.category}</span>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>{Number(item.percentage).toFixed(1)}%</span>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>{fmt(item.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        {/* Bar Chart */}
        <div style={{ flex: "1 1 340px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "16px" }}>Last 30 Days</h2>
          {data.daily_totals_30d.every((d) => d.total === 0) ? (
            <div style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "32px 0" }}>No data for the last 30 days</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.daily_totals_30d} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "#94a3b8" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={60} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(value) => [fmt(value), "Total"]} labelFormatter={formatDate} />
                <Bar dataKey="total" fill="#4f46e5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div style={{ flex: "1 1 300px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "16px" }}>This Month by Category</h2>
          {data.category_breakdown.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "32px 0" }}>No expenses this month</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.category_breakdown} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80}
                  label={({ category, percentage }) => `${category} ${Number(percentage).toFixed(1)}%`} labelLine={false}>
                  {data.category_breakdown.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => fmt(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Budget Overview */}
      {budgets.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginTop: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "16px" }}>Budget Overview</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {budgets.map((budget) => {
              const pct = Math.min((budget.current_spending / budget.monthly_limit) * 100, 100);
              const barColor = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f97316" : "#10b981";
              return (
                <div key={budget.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 500, color: "#334155" }}>{budget.category}</span>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      {fmt(budget.current_spending)} / {fmt(budget.monthly_limit)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "999px", transition: "width 0.3s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
