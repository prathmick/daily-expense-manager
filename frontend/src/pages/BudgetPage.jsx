import { useEffect, useState } from "react";
import { listBudgets, setBudget } from "../db/services";
import { fmt } from "../utils/currency";

const CATEGORIES = ["Food","Travel","Shopping","Bills","Others"];
const CAT_ICONS  = { Food:"🍔", Travel:"✈️", Shopping:"🛍️", Bills:"📄", Others:"📦" };
const CAT_COLORS = { Food:"#f59e0b", Travel:"#2563eb", Shopping:"#db2777", Bills:"#7c3aed", Others:"#16a34a" };

function BudgetCard({ category, budget, onSaved }) {
  const [limit, setLimit]     = useState(budget ? String(budget.monthly_limit) : "");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [editing, setEditing] = useState(!budget);

  useEffect(() => { setLimit(budget ? String(budget.monthly_limit) : ""); setEditing(!budget); }, [budget]);

  async function save() {
    const v = parseFloat(limit);
    if (!limit || isNaN(v) || v < 0.01) { setError("Enter a valid amount (min ₹0.01)"); return; }
    setError(null); setSaving(true);
    try { await setBudget(category, v); onSaved(); setEditing(false); }
    catch { setError("Failed to save."); }
    finally { setSaving(false); }
  }

  const pct    = budget ? Math.min((budget.current_spending/budget.monthly_limit)*100, 100) : 0;
  const color  = pct>=100?"#ef4444":pct>=80?"#f97316":"#10b981";
  const accent = CAT_COLORS[category]||"#4f46e5";

  return (
    <div className="card" style={{ borderLeft:`4px solid ${accent}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:budget?12:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:24 }}>{CAT_ICONS[category]}</span>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:"#1a1d2e" }}>{category}</div>
            {budget && !editing && <div style={{ fontSize:12, color:"#94a3b8" }}>Limit: {fmt(budget.monthly_limit)}</div>}
          </div>
        </div>
        {budget && !editing && (
          <button onClick={() => setEditing(true)} style={{ padding:"6px 12px", background:"#f1f5f9", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", color:"#475569" }}>✏️ Edit</button>
        )}
      </div>

      {budget && !editing && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:13, fontWeight:600, color }}>{fmt(budget.current_spending)} spent</span>
            <span style={{ fontSize:12, color:"#94a3b8" }}>{pct.toFixed(0)}%</span>
          </div>
          <div className="progress-track" style={{ height:10 }}>
            <div className="progress-fill" style={{ width:`${pct}%`, background:color }} />
          </div>
          {pct>=80 && <p style={{ margin:"6px 0 0", fontSize:12, color, fontWeight:600 }}>{pct>=100?"⚠️ Over budget!":"⚡ Approaching limit"}</p>}
        </>
      )}

      {editing && (
        <div style={{ marginTop:budget?14:0 }}>
          <label style={{ fontSize:12, fontWeight:600, color:"#64748b", display:"block", marginBottom:6 }}>Monthly Limit (₹)</label>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ position:"relative", flex:1 }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", fontWeight:600 }}>₹</span>
              <input type="number" min="0.01" step="0.01" value={limit} onChange={e=>setLimit(e.target.value)} placeholder="0.00"
                className="form-input" style={{ paddingLeft:28, fontSize:15, fontWeight:600 }} />
            </div>
            <button onClick={save} disabled={saving} style={{ padding:"0 18px", background:"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:saving?"not-allowed":"pointer" }}>
              {saving?"...":"Save"}
            </button>
            {budget && <button onClick={() => { setEditing(false); setLimit(String(budget.monthly_limit)); setError(null); }} style={{ padding:"0 14px", background:"#f1f5f9", color:"#64748b", border:"none", borderRadius:12, fontSize:14, cursor:"pointer" }}>Cancel</button>}
          </div>
          {error && <p style={{ margin:"6px 0 0", fontSize:12, color:"#ef4444" }}>⚠ {error}</p>}
        </div>
      )}
    </div>
  );
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    listBudgets().then(b => setBudgets(b)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  const getBudget = cat => budgets.find(b => b.category === cat) || null;

  return (
    <div className="page-content">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ margin:"0 0 4px", fontSize:20, fontWeight:800, color:"#1a1d2e" }}>Budget Settings</h1>
        <p style={{ margin:0, fontSize:14, color:"#64748b" }}>Set monthly spending limits per category</p>
      </div>
      {loading ? (
        <div>{CATEGORIES.map(c=><div key={c} className="skeleton" style={{ height:80, marginBottom:12, borderRadius:16 }} />)}</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {CATEGORIES.map(cat => <BudgetCard key={cat} category={cat} budget={getBudget(cat)} onSaved={load} />)}
        </div>
      )}
    </div>
  );
}
