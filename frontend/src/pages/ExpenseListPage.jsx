import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/apiClient";
import ExpenseFormModal from "../components/ExpenseFormModal";
import { fmt } from "../utils/currency";

const CATEGORIES = ["All", "Food", "Travel", "Shopping", "Bills", "Others"];
const PAGE_SIZE = 10;
const CAT_ICONS = { Food: "🍔", Travel: "✈️", Shopping: "🛍️", Bills: "📄", Others: "📦" };
const CAT_COLORS = {
  Food:     { bg: "#fef3c7", color: "#d97706" },
  Travel:   { bg: "#dbeafe", color: "#2563eb" },
  Shopping: { bg: "#fce7f3", color: "#db2777" },
  Bills:    { bg: "#ede9fe", color: "#7c3aed" },
  Others:   { bg: "#f0fdf4", color: "#16a34a" },
};

function formatDate(s) {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ExpenseListPage() {
  const [expenses, setExpenses]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [filters, setFilters]         = useState({ startDate: "", endDate: "", keyword: "", category: "" });
  const [pending, setPending]         = useState({ startDate: "", endDate: "", keyword: "", category: "" });
  const [page, setPage]               = useState(1);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Balance
  const [balanceData, setBalanceData]     = useState(null);
  const [balanceInput, setBalanceInput]   = useState("");
  const [savingBal, setSavingBal]         = useState(false);
  const [editingBal, setEditingBal]       = useState(false);

  const fetchBalance = useCallback(async () => {
    try { const r = await apiClient.get("/user/balance"); setBalanceData(r.data); setBalanceInput(String(r.data.balance)); }
    catch {}
  }, []);

  const fetchExpenses = useCallback(async (f) => {
    setLoading(true); setError("");
    try {
      const p = {};
      if (f.startDate) p.start_date = f.startDate;
      if (f.endDate)   p.end_date   = f.endDate;
      if (f.keyword)   p.keyword    = f.keyword;
      if (f.category && f.category !== "All") p.category = f.category;
      const r = await apiClient.get("/expenses", { params: p });
      setExpenses(r.data || []); setPage(1);
    } catch (e) { setError(e.response?.data?.detail || "Failed to load expenses."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBalance(); fetchExpenses(filters); }, [fetchBalance, fetchExpenses]);

  async function saveBalance() {
    const v = parseFloat(balanceInput);
    if (isNaN(v) || v < 0) { setError("Enter a valid balance"); return; }
    setSavingBal(true);
    try { const r = await apiClient.put("/user/balance", { balance: v }); setBalanceData(r.data); setEditingBal(false); }
    catch (e) { setError(e.response?.data?.detail || "Failed to save balance."); }
    finally { setSavingBal(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense?")) return;
    try { await apiClient.delete(`/expenses/${id}`); fetchExpenses(filters); fetchBalance(); }
    catch (e) { setError(e.response?.data?.detail || "Failed to delete."); }
  }

  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));
  const paginated  = expenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const balColor   = !balanceData ? "#1a1d2e" : balanceData.current_balance < 0 ? "#ef4444" : "#10b981";

  return (
    <div className="page-content">

      {/* ── Balance Hero Card ── */}
      <div style={{
        background: "linear-gradient(135deg,#0f172a,#1e293b)",
        borderRadius: 16, padding: "16px", marginBottom: 14, color: "#fff",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, background: "rgba(255,255,255,0.04)", borderRadius: "50%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, opacity: 0.6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Balance</p>
            <div style={{ fontSize: 26, fontWeight: 800, color: balColor, letterSpacing: "-0.5px" }}>
              {balanceData ? fmt(balanceData.current_balance) : "—"}
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, opacity: 0.5 }}>INITIAL</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{balanceData ? fmt(balanceData.balance) : "—"}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, opacity: 0.5 }}>SPENT</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#f87171" }}>{balanceData ? fmt(balanceData.total_expenses) : "—"}</p>
              </div>
            </div>
          </div>
          <div>
            {editingBal ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, opacity: 0.7 }}>₹</span>
                  <input type="number" min="0" step="0.01" value={balanceInput}
                    onChange={e => setBalanceInput(e.target.value)}
                    style={{ width: 120, padding: "8px 10px", borderRadius: 10, border: "none", fontSize: 14, background: "rgba(255,255,255,0.15)", color: "#fff", outline: "none" }}
                    autoFocus />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={saveBalance} disabled={savingBal} style={{ padding: "7px 14px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {savingBal ? "..." : "Save"}
                  </button>
                  <button onClick={() => setEditingBal(false)} style={{ padding: "7px 12px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditingBal(true)} style={{
                padding: "9px 16px", background: "rgba(255,255,255,0.12)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                {balanceData?.balance ? "✏️ Edit" : "➕ Set Balance"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a1d2e" }}>Expenses</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowFilters(f => !f)} style={{
            padding: "9px 14px", background: showFilters ? "#ede9fe" : "#f1f5f9",
            color: showFilters ? "#4f46e5" : "#64748b", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            🔍 Filter
          </button>
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary" style={{ padding: "9px 16px" }}>
            + Add
          </button>
        </div>
      </div>

      {/* ── Filters (collapsible) ── */}
      {showFilters && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <div style={{ flex: "1 1 140px" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>From</label>
              <input type="date" value={pending.startDate} onChange={e => setPending(f => ({ ...f, startDate: e.target.value }))}
                className="form-input" style={{ padding: "9px 12px", fontSize: 14 }} />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>To</label>
              <input type="date" value={pending.endDate} onChange={e => setPending(f => ({ ...f, endDate: e.target.value }))}
                className="form-input" style={{ padding: "9px 12px", fontSize: 14 }} />
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Search</label>
              <input type="text" placeholder="Search description..." value={pending.keyword}
                onChange={e => setPending(f => ({ ...f, keyword: e.target.value }))}
                className="form-input" style={{ padding: "9px 12px", fontSize: 14 }} />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Category</label>
              <select value={pending.category} onChange={e => setPending(f => ({ ...f, category: e.target.value }))}
                className="form-input" style={{ padding: "9px 12px", fontSize: 14 }}>
                {CATEGORIES.map(c => <option key={c} value={c === "All" ? "" : c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => { setFilters({ ...pending }); fetchExpenses(pending); }} className="btn-primary" style={{ padding: "9px 20px" }}>Apply</button>
            <button onClick={() => { const e = { startDate: "", endDate: "", keyword: "", category: "" }; setPending(e); setFilters(e); fetchExpenses(e); }} className="btn-secondary" style={{ padding: "9px 16px" }}>Clear</button>
          </div>
        </div>
      )}

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: "#dc2626", fontSize: 14 }}>{error}</div>}

      {/* ── Expense List ── */}
      {loading ? (
        <div>{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 72, marginBottom: 10, borderRadius: 14 }} />)}</div>
      ) : expenses.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">💸</div>
          <div className="empty-state-text">No expenses found</div>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "6px 0 0" }}>Tap "+ Add" to record your first expense</p>
        </div>
      ) : (
        <>
          {paginated.map(exp => {
            const cat = CAT_COLORS[exp.category] || { bg: "#f1f5f9", color: "#64748b" };
            return (
              <div key={exp.id} className="expense-row">
                <div className="expense-icon" style={{ background: cat.bg }}>
                  {CAT_ICONS[exp.category] || "📦"}
                </div>
                <div className="expense-info">
                  <div className="expense-category">{exp.category}</div>
                  <div className="expense-desc">{exp.description || "No description"}</div>
                </div>
                <div className="expense-right">
                  <div className="expense-amount">-{fmt(exp.amount)}</div>
                  <div className="expense-date">{formatDate(exp.date)}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 4 }}>
                  <button onClick={() => { setEditing(exp); setModalOpen(true); }}
                    style={{ padding: "5px 10px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", color: "#475569", fontWeight: 500 }}>
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(exp.id)}
                    style={{ padding: "5px 10px", background: "#fef2f2", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", color: "#dc2626", fontWeight: 500 }}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary" style={{ padding: "8px 16px", opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-secondary" style={{ padding: "8px 16px", opacity: page === totalPages ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </>
      )}

      <ExpenseFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        onSuccess={() => { fetchExpenses(filters); fetchBalance(); }} expense={editing} />
    </div>
  );
}
