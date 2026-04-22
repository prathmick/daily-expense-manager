import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import apiClient from "../api/apiClient";
import { fmt } from "../utils/currency";

const COLORS = ["#4f46e5","#06b6d4","#10b981","#f59e0b","#ef4444"];
const ICONS  = { Food:"🍔", Travel:"✈️", Shopping:"🛍️", Bills:"📄", Others:"📦" };
const fd = s => { const [,m,d]=s.split("-"); return `${m}/${d}`; };

const P = { padding: "12px 14px" };

export default function DashboardPage() {
  const [data, setData]   = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([apiClient.get("/reports/dashboard"), apiClient.get("/budgets")])
      .then(([d,b]) => { setData(d.data); setBudgets(b.data); })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={P}>
      {[1,2,3].map(i=><div key={i} style={{height:80,background:"#e2e8f0",borderRadius:14,marginBottom:10,animation:"pulse 1.5s infinite"}}/>)}
    </div>
  );
  if (error) return <div style={{padding:40,textAlign:"center",color:"#ef4444"}}>{error}</div>;

  const allZero = !data.today_total && !data.week_total && !data.month_total;

  return (
    <div style={{ padding: "14px 14px 0" }}>

      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,#4f46e5,#7c3aed)", borderRadius:18, padding:"20px 18px", marginBottom:14, color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-20,right:-20,width:100,height:100,background:"rgba(255,255,255,0.07)",borderRadius:"50%" }}/>
        <p style={{ margin:"0 0 2px",fontSize:11,opacity:0.75,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em" }}>This Month's Spending</p>
        <div style={{ fontSize:34,fontWeight:800,letterSpacing:"-1px" }}>{fmt(data.month_total)}</div>
        <p style={{ margin:"8px 0 0",fontSize:12,opacity:0.7 }}>Today {fmt(data.today_total)} · Week {fmt(data.week_total)}</p>
      </div>

      {/* 3 stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          {label:"Today",     val:data.today_total, icon:"☀️", color:"#f59e0b"},
          {label:"This Week", val:data.week_total,  icon:"📅", color:"#06b6d4"},
          {label:"Month",     val:data.month_total, icon:"📆", color:"#4f46e5"},
        ].map(({label,val,icon,color})=>(
          <div key={label} style={{ background:"#fff",borderRadius:14,padding:"12px 10px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:20,marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",marginBottom:3 }}>{label}</div>
            <div style={{ fontSize:13,fontWeight:800,color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{fmt(val)}</div>
          </div>
        ))}
      </div>

      {allZero && (
        <div style={{ background:"#fff",borderRadius:14,padding:"32px 20px",textAlign:"center",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:40,marginBottom:8 }}>🧾</div>
          <div style={{ fontWeight:700,color:"#1a1d2e",marginBottom:4 }}>No expenses yet</div>
          <div style={{ fontSize:13,color:"#94a3b8" }}>Add your first expense to see insights</div>
        </div>
      )}

      {/* Category breakdown */}
      {data.category_breakdown.length > 0 && (
        <div style={{ background:"#fff",borderRadius:14,padding:"16px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight:700,fontSize:15,marginBottom:14 }}>This Month by Category</div>
          {data.category_breakdown.map(item => {
            const pct = Number(item.percentage);
            return (
              <div key={item.category} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontSize:18 }}>{ICONS[item.category]||"📦"}</span>
                    <span style={{ fontWeight:600,fontSize:13 }}>{item.category}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight:700,fontSize:13 }}>{fmt(item.total)}</span>
                    <span style={{ fontSize:11,color:"#94a3b8",marginLeft:5 }}>{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div style={{ height:7,background:"#f1f5f9",borderRadius:999,overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#4f46e5,#7c3aed)",borderRadius:999 }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bar chart */}
      <div style={{ background:"#fff",borderRadius:14,padding:"16px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ fontWeight:700,fontSize:15,marginBottom:12 }}>Last 30 Days</div>
        {data.daily_totals_30d.every(d=>!d.total) ? (
          <div style={{ textAlign:"center",padding:"24px 0",color:"#94a3b8" }}>📊 No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.daily_totals_30d} margin={{top:4,right:4,left:0,bottom:0}}>
              <XAxis dataKey="date" tickFormatter={fd} tick={{fontSize:9,fill:"#94a3b8"}} interval="preserveStartEnd"/>
              <YAxis tick={{fontSize:9,fill:"#94a3b8"}} width={40} tickFormatter={v=>`₹${v}`}/>
              <Tooltip formatter={v=>[fmt(v),"Spent"]} labelFormatter={fd} contentStyle={{borderRadius:10,border:"none",fontSize:12}}/>
              <Bar dataKey="total" fill="#4f46e5" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie chart */}
      {data.category_breakdown.length > 0 && (
        <div style={{ background:"#fff",borderRadius:14,padding:"16px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight:700,fontSize:15,marginBottom:12 }}>Category Split</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.category_breakdown} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={70} innerRadius={30}>
                {data.category_breakdown.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:10,border:"none",fontSize:12}}/>
              <Legend iconType="circle" iconSize={9} wrapperStyle={{fontSize:11}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Budgets */}
      {budgets.length > 0 && (
        <div style={{ background:"#fff",borderRadius:14,padding:"16px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight:700,fontSize:15,marginBottom:14 }}>Budget Overview</div>
          {budgets.map(b => {
            const pct = Math.min((b.current_spending/b.monthly_limit)*100,100);
            const col = pct>=100?"#ef4444":pct>=80?"#f97316":"#10b981";
            return (
              <div key={b.id} style={{ marginBottom:14 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontSize:18 }}>{ICONS[b.category]||"📦"}</span>
                    <span style={{ fontWeight:600,fontSize:13 }}>{b.category}</span>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <span style={{ fontSize:13,fontWeight:700,color:col }}>{fmt(b.current_spending)}</span>
                    <span style={{ fontSize:11,color:"#94a3b8" }}> / {fmt(b.monthly_limit)}</span>
                  </div>
                </div>
                <div style={{ height:8,background:"#f1f5f9",borderRadius:999,overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${pct}%`,background:col,borderRadius:999 }}/>
                </div>
                {pct>=80&&<p style={{ margin:"4px 0 0",fontSize:11,color:col,fontWeight:600 }}>{pct>=100?"⚠️ Over budget!":"⚡ Near limit"}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
