import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/apiClient";
import ExpenseFormModal from "../components/ExpenseFormModal";
import { fmt } from "../utils/currency";

const CATEGORIES = ["All", "Food", "Travel", "Shopping", "Bills", "Others"];
const PAGE_SIZE = 10;

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export default function ExpenseListPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ startDate: "", endDate: "", keyword: "", category: "" });
  const [pendingFilters, setPendingFilters] = useState({ startDate: "", endDate: "", keyword: "", category: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Balance state
  const [balanceData, setBalanceData] = useState(null);
  const [balanceInput, setBalanceInput] = useState("");
  const [savingBalance, setSavingBalance] = useState(false);
  const [editingBalance, setEditingBalance] = useState(false);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await apiClient.get("/user/balance");
      setBalanceData(res.data);
      setBalanceInput(String(res.data.balance));
    } catch {
      // ignore
    }
  }, []);

  const fetchExpenses = useCallback(async (activeFilters) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (activeFilters.startDate) params.start_date = activeFilters.startDate;
      if (activeFilters.endDate) params.end_date = activeFilters.endDate;
      if (activeFilters.keyword) params.keyword = activeFilters.keyword;
      if (activeFilters.category && activeFilters.category !== "All") params.category = activeFilters.category;
      const res = await apiClient.get("/expenses", { params });
      setExpenses(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchExpenses(filters);
  }, [fetchBalance, fetchExpenses]);

  async function handleSaveBalance() {
    const val = parseFloat(balanceInput);
    if (isNaN(val) || val < 0) { setError("Enter a valid balance (≥ 0)"); return; }
    setSavingBalance(true);
    try {
      const res = await apiClient.put("/user/balance", { balance: val });
      setBalanceData(res.data);
      setEditingBalance(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save balance.");
    } finally {
      setSavingBalance(false);
    }
  }

  async function handleDelete(expenseId) {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await apiClient.delete(`/expenses/${expenseId}`);
      fetchExpenses(filters);
      fetchBalance();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete expense.");
    }
  }

  function handleApply() {
    setFilters({ ...pendingFilters });
    fetchExpenses(pendingFilters);
  }

  function handleClear() {
    const empty = { startDate: "", endDate: "", keyword: "", category: "" };
    setPendingFilters(empty);
    setFilters(empty);
    fetchExpenses(empty);
  }

  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));
  const paginated = expenses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const currentBalance = balanceData ? balanceData.current_balance : null;
  const balanceColor = currentBalance === null ? "#374151" : currentBalance < 0 ? "#dc2626" : "#059669";

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

      {/* Balance Card */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 24,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>INITIAL BALANCE</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>
              {balanceData ? fmt(balanceData.balance) : "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>TOTAL SPENT</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#dc2626" }}>
              {balanceData ? fmt(balanceData.total_expenses) : "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>CURRENT BALANCE</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: balanceColor }}>
              {balanceData ? fmt(balanceData.current_balance) : "—"}
            </div>
          </div>
        </div>

        {/* Set balance */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {editingBalance ? (
            <>
              <span style={{ fontSize: 13, color: "#64748b" }}>₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                style={{ width: 130, padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
                autoFocus
              />
              <button
                onClick={handleSaveBalance}
                disabled={savingBalance}
                style={{ padding: "7px 14px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
              >
                {savingBalance ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => { setEditingBalance(false); setBalanceInput(String(balanceData?.balance ?? "")); }}
                style={{ padding: "7px 14px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditingBalance(true)}
              style={{ padding: "7px 16px", background: "#f1f5f9", color: "#374151", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
            >
              {balanceData?.balance ? "Edit Balance" : "Set Balance"}
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Expenses</h2>
        <button
          onClick={() => { setEditingExpense(null); setModalOpen(true); }}
          style={{ padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}
        >
          + Add Expense
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", background: "#f9fafb", padding: 16, borderRadius: 8, marginBottom: 20, border: "1px solid #e5e7eb" }}>
        {[
          { label: "Start Date", key: "startDate", type: "date" },
          { label: "End Date", key: "endDate", type: "date" },
        ].map(({ label, key, type }) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#6b7280" }}>{label}</label>
            <input type={type} value={pendingFilters[key]}
              onChange={(e) => setPendingFilters((f) => ({ ...f, [key]: e.target.value }))}
              style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 14 }} />
          </div>
        ))}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#6b7280" }}>Keyword</label>
          <input type="text" placeholder="Search description..." value={pendingFilters.keyword}
            onChange={(e) => setPendingFilters((f) => ({ ...f, keyword: e.target.value }))}
            style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 14, minWidth: 180 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#6b7280" }}>Category</label>
          <select value={pendingFilters.category}
            onChange={(e) => setPendingFilters((f) => ({ ...f, category: e.target.value }))}
            style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 14 }}>
            {CATEGORIES.map((c) => <option key={c} value={c === "All" ? "" : c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <button onClick={handleApply} style={{ padding: "7px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 }}>Apply Filters</button>
          <button onClick={handleClear} style={{ padding: "7px 16px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", fontSize: 14 }}>Clear</button>
        </div>
      </div>

      {error && <div style={{ color: "#dc2626", marginBottom: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 4 }}>{error}</div>}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Loading...</div>
      ) : expenses.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7280", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>No expenses found</div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                  {["Date", "Category", "Amount", "Description", "Actions"].map((col) => (
                    <th key={col} style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 600, color: "#374151" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((expense) => (
                  <tr key={expense.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 12px", color: "#374151" }}>{formatDate(expense.date)}</td>
                    <td style={{ padding: "10px 12px", color: "#374151" }}>{expense.category}</td>
                    <td style={{ padding: "10px 12px", color: "#dc2626", fontWeight: 600 }}>{fmt(expense.amount)}</td>
                    <td style={{ padding: "10px 12px", color: "#6b7280", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{expense.description || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <button onClick={() => { setEditingExpense(expense); setModalOpen(true); }}
                        style={{ marginRight: 8, padding: "4px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", fontSize: 13, color: "#374151" }}>Edit</button>
                      <button onClick={() => handleDelete(expense.id)}
                        style={{ padding: "4px 10px", background: "#fff", border: "1px solid #fca5a5", borderRadius: 4, cursor: "pointer", fontSize: 13, color: "#dc2626" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 16 }}>
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
              style={{ padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 4, cursor: currentPage === 1 ? "not-allowed" : "pointer", background: "#fff", color: currentPage === 1 ? "#9ca3af" : "#374151", fontSize: 14 }}>Previous</button>
            <span style={{ fontSize: 14, color: "#374151" }}>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              style={{ padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 4, cursor: currentPage === totalPages ? "not-allowed" : "pointer", background: "#fff", color: currentPage === totalPages ? "#9ca3af" : "#374151", fontSize: 14 }}>Next</button>
          </div>
        </>
      )}

      <ExpenseFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { fetchExpenses(filters); fetchBalance(); }}
        expense={editingExpense}
      />
    </div>
  );
}
