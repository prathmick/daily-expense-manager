import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import apiClient from "../api/apiClient";
import { fmt } from "../utils/currency";

const PIE_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
const fmtDate = (s) => { const [,m,d] = s.split("-"); return `${m}/${d}`; };

function StatCard({ label, value, color, icon, sub }) {
  return (
    <div style={{
      flex: "1 1 140px", minWidth: 0,
      background: "#fff", borderRadius: 16, padding: "18px 16px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: color || "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const CATEGORY_ICONS = { Food: "🍔", Travel: "✈️", Shopping: "🛍️", Bills: "📄", Others: "📦" };

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([apiClient.get("/reports/dashboard"), apiClient.get("/budgets")])
      .then(([d, b]) => { setData(d.data); setBudgets(b.data); })
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-content">
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12, borderRadius: 16 }} />)}
    </div>
  );
  if (error) return <div className="page-content"><div style={{ textAlign: "center", color: "#ef4444", padding: 48 }}>{error}</div></div>;

  const allZero = !data.today_total && !data.week_total && !data.month_total;

  return (
    <div className="page-content">
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        borderRadius: 20, padding: "24px 20px", marginBottom: 20,
        color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -30, right: 40, width: 80, height: 80, background: "rgba(255,255,255,0.06)", borderRadius: "50%" }} />
        <p style={{ margin: "0 0 4px", fontSize: 13, opacity: 0.8, fontWeight: 500 }}>This Month's Spending</p>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.5px" }}>{fmt(data.month_total)}</div>
        <p style={{ margin: "8px 0 0", fontSize: 12, opacity: 0.7 }}>
          Today: {fmt(data.today_total)} · This week: {fmt(data.week_total)}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Today" value={fmt(data.today_total)} icon="☀️" color="#f59e0b" />
        <StatCard label="This Week" value={fmt(data.week_total)} icon="📅" color="#06b6d4" />
        <StatCard label="This Month" value={fmt(data.month_total)} icon="📆" color="#4f46e5" />
      </div>

      {allZero && (
        <div className="empty-state card" style={{ marginBottom: 20 }}>
          <div className="empty-state-icon">🧾</div>
          <div className="empty-state-text">No expenses yet</div>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "6px 0 0" }}>Add your first expense to see insights here</p>
        </div>
      )}

      {/* Category breakdown */}
      {data.category_breakdown.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="section-header">This Month by Category</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.category_breakdown.map((item) => {
              const pct = Number(item.percentage);
              return (
                <div key={item.category}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[item.category] || "📦"}</span>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1d2e" }}>{item.category}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1d2e" }}>{fmt(item.total)}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 6 }}>{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#4f46e5,#7c3aed)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div className="card" style={{ flex: "1 1 300px" }}>
          <h2 className="section-header">Last 30 Days</h2>
          {data.daily_totals_30d.every(d => !d.total) ? (
            <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No data yet</div></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.daily_totals_30d} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={50} tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={v => [fmt(v), "Spent"]} labelFormatter={fmtDate} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} />
                <Bar dataKey="total" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {data.category_breakdown.length > 0 && (
          <div className="card" style={{ flex: "1 1 260px" }}>
            <h2 className="section-header">Category Split</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.category_breakdown} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={75} innerRadius={35}>
                  {data.category_breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Budget overview */}
      {budgets.length > 0 && (
        <div className="card">
          <h2 className="section-header">Budget Overview</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {budgets.map(b => {
              const pct = Math.min((b.current_spending / b.monthly_limit) * 100, 100);
              const color = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f97316" : "#10b981";
              return (
                <div key={b.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[b.category] || "📦"}</span>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{b.category}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color }}>{fmt(b.current_spending)}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}> / {fmt(b.monthly_limit)}</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  {pct >= 80 && (
                    <p style={{ margin: "4px 0 0", fontSize: 11, color, fontWeight: 500 }}>
                      {pct >= 100 ? "⚠️ Over budget!" : "⚡ Approaching limit"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
