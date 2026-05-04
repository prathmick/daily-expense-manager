import { useEffect, useState } from "react";
import { getMonthlyReport, exportCSV } from "../db/services";
import { fmt } from "../utils/currency";

const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAT_ICONS = { Food:"🍔", Travel:"✈️", Shopping:"🛍️", Bills:"📄", Others:"📦" };
const now  = new Date();
const YEARS = Array.from({ length:11 }, (_,i) => now.getFullYear()-5+i);

export default function ReportPage() {
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth()+1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExp] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMonthlyReport(year, month).then(r => setReport(r)).finally(() => setLoading(false));
  }, [year, month]);

  async function handleExportCSV() {
    setExp(true);
    try { await exportCSV(); }
    finally { setExp(false); }
  }

  return (
    <div className="page-content">
      <h1 style={{ margin:"0 0 20px", fontSize:20, fontWeight:800, color:"#1a1d2e" }}>Monthly Report</h1>

      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 }}>
          <div style={{ flex:"1 1 120px" }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase" }}>Year</label>
            <select value={year} onChange={e=>setYear(Number(e.target.value))} className="form-input" style={{ fontSize:14, padding:"10px 12px" }}>
              {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ flex:"2 1 180px" }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase" }}>Month</label>
            <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="form-input" style={{ fontSize:14, padding:"10px 12px" }}>
              {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleExportCSV} disabled={exporting} style={{ width:"100%", padding:"11px", background:exporting?"#94a3b8":"linear-gradient(135deg,#10b981,#059669)", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:exporting?"not-allowed":"pointer", boxShadow:"0 4px 12px rgba(16,185,129,0.3)" }}>
          {exporting?"Exporting...":"📥 Export CSV"}
        </button>
      </div>

      {loading && <div>{[1,2].map(i=><div key={i} className="skeleton" style={{ height:80, marginBottom:12, borderRadius:16 }} />)}</div>}

      {!loading && report && (
        report.expense_count === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">No expenses for {MONTHS[month-1]} {year}</div>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", gap:12, marginBottom:20 }}>
              <div className="card" style={{ flex:1, textAlign:"center" }}>
                <p style={{ margin:"0 0 6px", fontSize:12, fontWeight:600, color:"#94a3b8", textTransform:"uppercase" }}>Total Spent</p>
                <div style={{ fontSize:24, fontWeight:800, color:"#4f46e5" }}>{fmt(report.total_amount)}</div>
              </div>
              <div className="card" style={{ flex:1, textAlign:"center" }}>
                <p style={{ margin:"0 0 6px", fontSize:12, fontWeight:600, color:"#94a3b8", textTransform:"uppercase" }}>Transactions</p>
                <div style={{ fontSize:24, fontWeight:800, color:"#1a1d2e" }}>{report.expense_count}</div>
              </div>
            </div>
            <div className="card">
              <h2 className="section-header">Category Breakdown</h2>
              {report.category_breakdown.map(item => {
                const pct = Number(item.percentage);
                return (
                  <div key={item.category} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:18 }}>{CAT_ICONS[item.category]||"📦"}</span>
                        <span style={{ fontWeight:600, fontSize:14 }}>{item.category}</span>
                      </div>
                      <div>
                        <span style={{ fontWeight:700, fontSize:14, color:"#1a1d2e" }}>{fmt(item.total)}</span>
                        <span style={{ fontSize:12, color:"#94a3b8", marginLeft:6 }}>{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width:`${pct}%`, background:"linear-gradient(90deg,#4f46e5,#7c3aed)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      )}
    </div>
  );
}
