import { useState, useEffect } from "react";
import { createExpense, updateExpense } from "../db/services";

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Others"];
const CAT_ICONS  = { Food:"🍔", Travel:"✈️", Shopping:"🛍️", Bills:"📄", Others:"📦" };
const init  = { amount:"", category:"", date:"", description:"" };
const initE = { amount:"", category:"", date:"", description:"" };

function validate(name, value) {
  if (name==="amount") {
    if (!value && value!==0) return "Amount is required";
    if (isNaN(parseFloat(value)) || parseFloat(value)<=0) return "Must be greater than 0";
  }
  if (name==="category" && !value) return "Category is required";
  if (name==="date"     && !value) return "Date is required";
  if (name==="description" && value.length>255) return "Max 255 characters";
  return "";
}

export default function ExpenseFormModal({ isOpen, onClose, onSuccess, expense }) {
  const [form, setForm]     = useState(init);
  const [errors, setErrors] = useState(initE);
  const [apiError, setErr]  = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(expense ? { amount:String(expense.amount??""), category:expense.category||"", date:expense.date||"", description:expense.description||"" } : init);
    setErrors(initE); setErr("");
  }, [isOpen, expense]);

  if (!isOpen) return null;

  function onChange(e) {
    const { name, value } = e.target;
    setForm(p=>({...p,[name]:value}));
    if (errors[name]) setErrors(p=>({...p,[name]:validate(name,value)}));
  }
  function onBlur(e) {
    const { name, value } = e.target;
    setErrors(p=>({...p,[name]:validate(name,value)}));
  }
  function validateAll() {
    const e = { amount:validate("amount",form.amount), category:validate("category",form.category), date:validate("date",form.date), description:validate("description",form.description) };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateAll()) return;
    setSaving(true); setErr("");
    try {
      const payload = { amount:parseFloat(form.amount), category:form.category, date:form.date, description:form.description||null };
      if (expense) await updateExpense(expense.id, payload);
      else         await createExpense(payload);
      onSuccess(); onClose();
    } catch (err) { setErr(err.message || "Something went wrong"); }
    finally { setSaving(false); }
  }

  const isEdit = Boolean(expense);

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", padding:"20px 16px 28px", width:"100%", maxWidth:520, boxShadow:"0 -8px 40px rgba(0,0,0,0.2)", maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ width:40, height:4, background:"#e2e8f0", borderRadius:2, margin:"0 auto 20px" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:"#1a1d2e" }}>{isEdit?"Edit Expense":"Add Expense"}</h3>
          <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:10, width:32, height:32, fontSize:16, cursor:"pointer", color:"#64748b", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {apiError && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:16, color:"#dc2626", fontSize:14 }}>✕ {apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:6 }}>Amount (₹) *</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"#94a3b8", fontWeight:600 }}>₹</span>
              <input type="number" name="amount" value={form.amount} onChange={onChange} onBlur={onBlur} min="0.01" step="0.01" placeholder="0.00"
                className={`form-input${errors.amount?" error":""}`} style={{ paddingLeft:32, fontSize:18, fontWeight:700 }} />
            </div>
            {errors.amount && <p style={{ margin:"4px 0 0", fontSize:12, color:"#ef4444" }}>⚠ {errors.amount}</p>}
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:8 }}>Category *</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => { setForm(p=>({...p,category:c})); setErrors(p=>({...p,category:""})); }}
                  style={{ padding:"8px 14px", borderRadius:10, border:"2px solid", borderColor:form.category===c?"#4f46e5":"#e2e8f0", background:form.category===c?"#ede9fe":"#fff", color:form.category===c?"#4f46e5":"#64748b", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                  {CAT_ICONS[c]} {c}
                </button>
              ))}
            </div>
            {errors.category && <p style={{ margin:"4px 0 0", fontSize:12, color:"#ef4444" }}>⚠ {errors.category}</p>}
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:6 }}>Date *</label>
            <input type="date" name="date" value={form.date} onChange={onChange} onBlur={onBlur}
              className={`form-input${errors.date?" error":""}`} style={{ fontSize:14 }} />
            {errors.date && <p style={{ margin:"4px 0 0", fontSize:12, color:"#ef4444" }}>⚠ {errors.date}</p>}
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:6 }}>Note <span style={{ fontWeight:400, color:"#94a3b8" }}>(optional)</span></label>
            <textarea name="description" value={form.description} onChange={onChange} onBlur={onBlur} maxLength={255} rows={2} placeholder="What was this for?"
              className={`form-input${errors.description?" error":""}`} style={{ resize:"none", fontSize:14 }} />
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              {errors.description ? <p style={{ margin:"4px 0 0", fontSize:12, color:"#ef4444" }}>⚠ {errors.description}</p> : <span />}
              <span style={{ fontSize:11, color:form.description.length>240?"#ef4444":"#94a3b8" }}>{form.description.length}/255</span>
            </div>
          </div>

          <button type="submit" disabled={saving} style={{ width:"100%", padding:"14px", background:saving?"#a5b4fc":"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff", border:"none", borderRadius:14, fontSize:16, fontWeight:700, cursor:saving?"not-allowed":"pointer", boxShadow:"0 4px 14px rgba(79,70,229,0.35)" }}>
            {saving?"Saving...":isEdit?"Save Changes":"Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
