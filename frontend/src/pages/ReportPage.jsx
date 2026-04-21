import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { fmt } from "../utils/currency";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

export default function ReportPage() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get("/reports/monthly", { params: { year, month } })
      .then((res) => setReport(res.data))
      .catch(() => setError("Failed to load report."))
      .finally(() => setLoading(false));
  }, [year, month]);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const response = await apiClient.get("/reports/export", {
        params: { format },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(`Failed to export ${format.toUpperCase()}.`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1e293b", marginBottom: "24px" }}>
        Monthly Report
      </h1>

      {/* Selectors */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "28px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
            Year
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              padding: "8px 12px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#1e293b",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
            Month
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            style={{
              padding: "8px 12px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#1e293b",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {MONTHS.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting !== null}
            style={{
              padding: "8px 16px",
              background: exporting === "csv" ? "#94a3b8" : "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: exporting !== null ? "not-allowed" : "pointer",
            }}
          >
            {exporting === "csv" ? "Exporting..." : "Export CSV"}
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            style={{
              padding: "8px 16px",
              background: exporting === "pdf" ? "#94a3b8" : "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: exporting !== null ? "not-allowed" : "pointer",
            }}
          >
            {exporting === "pdf" ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign: "center", color: "#64748b", padding: "48px 0" }}>
          Loading report...
        </div>
      )}

      {error && (
        <div style={{ textAlign: "center", color: "#ef4444", padding: "48px 0" }}>
          {error}
        </div>
      )}

      {!loading && !error && report && (
        <>
          {report.expense_count === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "15px",
                padding: "48px 0",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
              }}
            >
              No expenses for this period.
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
                <div
                  style={{
                    flex: "1 1 180px",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "24px 20px",
                    textAlign: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px", fontWeight: 500 }}>
                    Total Amount
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b" }}>
                    {fmt(report.total_amount)}
                  </div>
                </div>
                <div
                  style={{
                    flex: "1 1 180px",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "24px 20px",
                    textAlign: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px", fontWeight: 500 }}>
                    Expenses
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b" }}>
                    {report.expense_count}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "24px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "16px" }}>
                  Category Breakdown
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                        Category
                      </th>
                      <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                        Total
                      </th>
                      <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.category_breakdown.map((item) => (
                      <tr
                        key={item.category}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155", fontWeight: 500 }}>
                          {item.category}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "14px", color: "#1e293b", fontWeight: 600, textAlign: "right" }}>
                          {fmt(item.total)}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "14px", color: "#64748b", textAlign: "right" }}>
                          {Number(item.percentage).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
