import { useState, useEffect, useCallback } from "react";
import { listExpenses, deleteExpense, getBalanceData, setBalance, setMonthlySalary } from "../db/services";
import ExpenseFormModal from "../components/ExpenseFormModal";
import { fmt } from "../utils/currency";

const CATEGORIES = ["All", "Food", "Travel", "Shopping", "Bills", "Others"];
const PAGE_SIZE  = 10;
const CAT_ICONS  = { Food:"🍔", Travel:"✈️", Shopping:"🛍️", Bills:"📄", Others:"📦" };
const CAT_COLORS = { Food:{bg:"#fef3c7",color:"#d97706"}, Travel:{bg:"#dbeafe",color:"#2563eb"}, Shopping:{bg:"#fce7f3",color:"#db2777"}, Bills:{bg:"#ede9fe",color:"#7c3aed"}, Others:{bg:"#f0fdf4",color:"#16a34a"} };

function formatDate(s) {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

function InlineEdit({ label, value, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput]     = useState(String(value || ""));
  useEffect(() => { setInput(String(value || "")); }, [value]);

  if (!editing) return (
    <div>
      <p style={{ margin:"0 0 2px", fontSize:10, opacity:0.55, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</p>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:16, fontWeight:800 }}>{value ? fmt(value) : "—"}</span>
        <button onClick={() => setEditing(true)} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, padding:"3px 8px", color:"#fff", fontSize:11, cursor:"pointer", fontWeight:600 }}>
          {value ? "Edit" : "Set"}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <p style={{ margin:"0 0 4px", fontSize:10, opacity:0.55, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</p>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ opacity:0.7, fontSize:13 }}>₹</span>
        <input type="number" min="0" step="0.01" value={input} onChange={e => setInput(e.target.value)} autoFocus
          style={{ width:110, padding:"6px 8px", borderRadius:8, border:"none", fontSize:14, background:"rgba(255,255,255,0.15)", color:"#fff", outline:"none" }} />
        <button onClick={async () => { await onSave(parseFloat(input)); setEditing(false); }} disabled={saving}
          style={{ background:"#4f46e5", border:"none", borderRadius:8, padding:"6px 12px", color:"#fff", fontSize:12, cursor:"pointer", fontWeight:700 }}>
          {saving ? "..." : "Save"}
        </button>
        <button onClick={() => setEditing(false)}
          style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", fontSize:12, cursor:"pointer" }}>✕</button>
      </div>
    </div>
  );
}

export default function ExpenseListPage() {
  const [expenses, setExpenses]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [filters, setFilters]         = useState({ startDate:"", endDate:"", keyword:"", category:"" });
  const [pending, setPending]         = useState({ startDate:"", endDate:"", keyword:"", category:"" });
  const [page, setPage]               = useState(1);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [balanceData, setBalanceData] = useState(null);
  const [savingBal, setSavingBal]     = useState(false);
  const [savingSal, setSavingSal]     = useState(false);

  const fetchBalance = useCallback(async () => {
    try { setBalanceData(await getBalanceData()); } catch {}
  }, []);

  const fetchExpenses = useCallback(async (f) => {
    setLoading(true); setError("");
    try {
      const params = {};
      if (f.startDate) params.start_date = f.startDate;
      if (f.endDate)   params.end_date   = f.endDate;
      if (f.keyword)   params.keyword    = f.keyword;
      if (f.category && f.category !== "All") params.category = f.category;
      setExpenses(await listExpenses(params)); setPage(1);
    } catch (e) { setError("Failed to load expenses."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBalance(); fetchExpenses(filters); }, [fetchBalance, fetchExpenses]);

  async function saveBalanceFn(v) {
    if (isNaN(v) || v < 0) return;
    setSavingBal(true);
    try { setBalanceData(await setBalance(v)); } catch { setError("Failed to save."); }
    finally { setSavingBal(false); }
  }

  async function saveSalaryFn(v) {
    if (isNaN(v) || v < 0) return;
    setSavingSal(true);
    try { setBalanceData(await setMonthlySalary(v)); } catch { setError("Failed to save."); }
    finally { setSavingSal(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense?")) return;
    try { await deleteExpense(id); fetchExpenses(filters); fetchBalance(); }
    catch { setError("Failed to delete."); }
  }

  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));
  const paginated  = expenses.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const salaryPct  = balanceData?.monthly_salary > 0 ? Math.min((balanceData.month_expenses/balanceData.monthly_salary)*100, 100) : 0;
  const salaryBarColor = salaryPct>=100?"#ef4444":salaryPct>=80?"#f97316":"#10b981";

  return (
    <div className="page-content">
      {/* Salary/Balance Card */}
      <div style={{ background:"linear-gradient(135deg,#4f46e5,#7c3aed)", borderRadius:16, padding:"16px", marginBottom:14, color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-20, right:-20, width:90, height:90, background:"rgba(255,255,255,0.07)", borderRadius:"50%" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, flexWrap:"wrap", gap:12 }}>
          <InlineEdit label="Monthly Salary" value={balanceData?.monthly_salary} onSave={saveSalaryFn} saving={savingSal} />
          <InlineEdit label="Total Balance"  value={balanceData?.balance}         onSave={saveBalanceFn} saving={savingBal} />
        </div>
        {balanceData?.monthly_salary > 0 && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:11, opacity:0.75, fontWeight:600 }}>THIS MONTH SPENT</span>
              <span style={{ fontSize:12, fontWeight:700 }}>{fmt(balanceData.month_expenses)} / {fmt(balanceData.monthly_salary)}</span>
            </div>
            <div style={{ height:8, background:"rgba(255,255,255,0.2)", borderRadius:999, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${salaryPct}%`, background:salaryBarColor, borderRadius:999, transition:"width 0.4s ease" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:11, opacity:0.7 }}>{salaryPct.toFixed(0)}% used</span>
              <span style={{ fontSize:12, fontWeight:700, color:balanceData.month_remaining>=0?"#86efac":"#fca5a5" }}>
                {balanceData.month_remaining>=0 ? `${fmt(balanceData.month_remaining)} left` : `${fmt(Math.abs(balanceData.month_remaining))} over`}
              </span>
            </div>
          </div>
        )}
        <div style={{ marginTop:balanceData?.monthly_salary>0?12:0, paddingTop:balanceData?.monthly_salary>0?12:0, borderTop:balanceData?.monthly_salary>0?"1px solid rgba(255,255,255,0.15)":"none", display:"flex", gap:20 }}>
          <div>
            <p style={{ margin:"0 0 2px", fontSize:10, opacity:0.55, fontWeight:600, textTransform:"uppercase" }}>CURRENT BALANCE</p>
            <span style={{ fontSize:18, fontWeight:800, color:(balanceData?.current_balance??0)<0?"#fca5a5":"#86efac" }}>{balanceData?fmt(balanceData.current_balance):"—"}</span>
          </div>
          <div>
            <p style={{ margin:"0 0 2px", fontSize:10, opacity:0.55, fontWeight:600, textTransform:"uppercase" }}>TOTAL SPENT</p>
            <span style={{ fontSize:18, fontWeight:800, color:"#fca5a5" }}>{balanceData?fmt(balanceData.total_expenses):"—"}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <h1 style={{ margin:0, fontSize:18, fontWeight:800, color:"#1a1d2e" }}>Expenses</h1>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setShowFilters(f=>!f)} style={{ padding:"9px 14px", background:showFilters?"#ede9fe":"#f1f5f9", color:showFilters?"#4f46e5":"#64748b", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer" }}>🔍 Filter</button>
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary" style={{ padding:"9px 16px" }}>+ Add</button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card" style={{ marginBottom:14 }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {[{label:"From",key:"startDate"},{label:"To",key:"endDate"}].map(({label,key}) => (
              <div key={key} style={{ flex:"1 1 130px" }}>
                <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>{label}</label>
                <input type="date" value={pending[key]} onChange={e=>setPending(f=>({...f,[key]:e.target.value}))} className="form-input" style={{ padding:"9px 10px", fontSize:13 }} />
              </div>
            ))}
            <div style={{ flex:"1 1 150px" }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Search</label>
              <input type="text" placeholder="Search..." value={pending.keyword} onChange={e=>setPending(f=>({...f,keyword:e.target.value}))} className="form-input" style={{ padding:"9px 10px", fontSize:13 }} />
            </div>
            <div style={{ flex:"1 1 130px" }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Category</label>
              <select value={pending.category} onChange={e=>setPending(f=>({...f,category:e.target.value}))} className="form-input" style={{ padding:"9px 10px", fontSize:13 }}>
                {CATEGORIES.map(c=><option key={c} value={c==="All"?"":c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <button onClick={() => { setFilters({...pending}); fetchExpenses(pending); }} className="btn-primary" style={{ padding:"9px 18px" }}>Apply</button>
            <button onClick={() => { const e={startDate:"",endDate:"",keyword:"",category:""}; setPending(e); setFilters(e); fetchExpenses(e); }} className="btn-secondary" style={{ padding:"9px 14px" }}>Clear</button>
          </div>
        </div>
      )}

      {error && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:12, color:"#dc2626", fontSize:13 }}>{error}</div>}

      {loading ? (
        <div>{[1,2,3,4].map(i=><div key={i} className="skeleton" style={{ height:68, marginBottom:8, borderRadius:12 }} />)}</div>
      ) : expenses.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">💸</div>
          <div className="empty-state-text">No expenses found</div>
          <p style={{ fontSize:12, color:"#94a3b8", margin:"4px 0 0" }}>Tap "+ Add" to record your first expense</p>
        </div>
      ) : (
        <>
          {paginated.map(exp => {
            const cat = CAT_COLORS[exp.category] || { bg:"#f1f5f9", color:"#64748b" };
            return (
              <div key={exp.id} className="expense-row">
                <div className="expense-icon" style={{ background:cat.bg }}>{CAT_ICONS[exp.category]||"📦"}</div>
                <div className="expense-info">
                  <div className="expense-category">{exp.category}</div>
                  <div className="expense-desc">{exp.description||"No description"}</div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{formatDate(exp.date)}</div>
                </div>
                <div className="expense-right">
                  <div className="expense-amount">-{fmt(exp.amount)}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4, marginLeft:4 }}>
                  <button onClick={() => { setEditing(exp); setModalOpen(true); }} style={{ padding:"5px 8px", background:"#f1f5f9", border:"none", borderRadius:8, fontSize:13, cursor:"pointer" }}>✏️</button>
                  <button onClick={() => handleDelete(exp.id)} style={{ padding:"5px 8px", background:"#fef2f2", border:"none", borderRadius:8, fontSize:13, cursor:"pointer" }}>🗑️</button>
                </div>
              </div>
            );
          })}
          {totalPages > 1 && (
            <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12, marginTop:14 }}>
              <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-secondary" style={{ padding:"8px 16px", opacity:page===1?0.4:1 }}>← Prev</button>
              <span style={{ fontSize:13, color:"#64748b", fontWeight:500 }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="btn-secondary" style={{ padding:"8px 16px", opacity:page===totalPages?0.4:1 }}>Next →</button>
            </div>
          )}
        </>
      )}

      <ExpenseFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        onSuccess={() => { fetchExpenses(filters); fetchBalance(); }} expense={editing} />
    </div>
  );
}
