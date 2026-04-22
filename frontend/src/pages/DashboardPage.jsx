import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import apiClient from "../api/apiClient";
import { fmt } from "../utils/currency";

const PIE_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
const fmtDate = (s) => { const [,m,d] = s.split("-"); return `${m}/${d}`; };
const CAT_ICONS = { Food:"🍔", Travel:"✈️", Shopping:"🛍️", Bills:"📄", Others:"📦" };

export default function DashboardPage() {
  const [data, setData]       = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    Promise.all([apiClient.get("/reports/dashboard"), apiClient.get("/budgets")])
      .then(([d, b]) => { setData(d.data); setBudgets(b.data); })
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-content">
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 70, marginBottom: 10 }} />)}
    </div>
  );
  if (error) return <div className="page-content" style={{ textAlign:"center", color:"#ef4444", padding:40 }}>{error}</div>;

  const allZero = !data.today_total && !data.week_total && !data.month_total;

  return (
    <div className="page-content">

      {/* Hero spending card */}
      <div style={{
        background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
        borderRadius: 16, padding: "18px 16px", marginBottom: 14, color: "#fff",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, background:"rgba(255,255,255,0.07)", borderRadius:"50%" }} />
        <p style={{ margin:"0 0 2px", fontSize:11, opacity:0.75, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>This Month</p>
        <div style={{ fontSize:30, fontWeight:800, letterSpacing:"-0.5px" }}>{fmt(data.month_total)}</div>
        <p style={{ margin:"6px 0 0", fontSize:11, opacity:0.65 }}>
          Today {fmt(data.today_total)} · Week {fmt(data.week_total)}
        </p>
      </div>

      {/* Stat row */}
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        {[
          { label:"Today",      val: data.today_total,  icon:"☀️",  color:"#f59e0b" },
          { label:"This Week",  val: data.week_total,   icon:"📅",  color:"#06b6d4" },
          { label:"This Month", val: data.month_total,  icon:"📆",  color:"#4f46e5" },
        ].map(({ label, val, icon, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value" style={{ color, fontSize:15 }}>{fmt(val)}</div>
          </div>
        ))}
      </div>

      {allZero && (
        <div className="empty-state card" style={{ marginBottom:14 }}>
          <div className="empty-state-icon">🧾</div>
          <div className="empty-state-text">No expenses yet</div>
          <p style={{ fontSize:12, color:"#94a3b8", margin:"4px 0 0" }}>Add your first expense to see insights</p>
        </div>
      )}

      {/* Category breakdown */}
      {data.category_breakdown.length > 0 && (
        <div className="card" style={{ marginBottom:14 }}>
          <h2 className="section-header">This Month by Category</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {data.category_breakdown.map(item => {
              const pct = Number(item.percentage);
              return (
                <div key={item.category}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:16 }}>{CAT_ICONS[item.category]||"📦"}</span>
                      <span style={{ fontWeight:600, fontSize:13 }}>{item.category}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight:700, fontSize:13 }}>{fmt(item.total)}</span>
                      <span style={{ fontSize:11, color:"#94a3b8", marginLeft:5 }}>{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width:`${pct}%`, background:"linear-gradient(90deg,#4f46e5,#7c3aed)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bar chart */}
      <div className="card" style={{ marginBottom:14 }}>
        <h2 className="section-header">Last 30 Days</h2>
        {data.daily_totals_30d.every(d => !d.total) ? (
          <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No data yet</div></div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.daily_totals_30d} margin={{ top:4, right:4, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize:9, fill:"#94a3b8" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize:9, fill:"#94a3b8" }} width={44} tickFormatter={v=>`₹${v}`} />
              <Tooltip formatter={v=>[fmt(v),"Spent"]} labelFormatter={fmtDate}
                contentStyle={{ borderRadius:10, border:"none", boxShadow:"0 4px 16px rgba(0,0,0,0.12)", fontSize:12 }} />
              <Bar dataKey="total" fill="url(#barGrad)" radius={[3,3,0,0]} />
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

      {/* Pie chart */}
      {data.category_breakdown.length > 0 && (
        <div className="card" style={{ marginBottom:14 }}>
          <h2 className="section-header">Category Split</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.category_breakdown} dataKey="total" nameKey="category"
                cx="50%" cy="50%" outerRadius={75} innerRadius={35}>
                {data.category_breakdown.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v=>fmt(v)} contentStyle={{ borderRadius:10, border:"none", fontSize:12 }} />
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Budget overview */}
      {budgets.length > 0 && (
        <div className="card">
          <h2 className="section-header">Budget Overview</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {budgets.map(b => {
              const pct   = Math.min((b.current_spending/b.monthly_limit)*100, 100);
              const color = pct>=100?"#ef4444":pct>=80?"#f97316":"#10b981";
              return (
                <div key={b.id}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:16 }}>{CAT_ICONS[b.category]||"📦"}</span>
                      <span style={{ fontWeight:600, fontSize:13 }}>{b.category}</span>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <span style={{ fontSize:13, fontWeight:700, color }}>{fmt(b.current_spending)}</span>
                      <span style={{ fontSize:11, color:"#94a3b8" }}> / {fmt(b.monthly_limit)}</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width:`${pct}%`, background:color }} />
                  </div>
                  {pct>=80 && <p style={{ margin:"4px 0 0", fontSize:11, color, fontWeight:600 }}>{pct>=100?"⚠️ Over budget!":"⚡ Approaching limit"}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
