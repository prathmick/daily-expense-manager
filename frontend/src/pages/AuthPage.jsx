import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/apiClient";

const S = {
  page: { minHeight: "100dvh", background: "linear-gradient(160deg,#4f46e5 0%,#7c3aed 45%,#f0f2f7 45%)", display: "flex", flexDirection: "column" },
  top:  { padding: "52px 24px 28px", textAlign: "center" },
  card: { flex: 1, background: "#fff", borderRadius: "28px 28px 0 0", padding: "28px 20px 48px", boxShadow: "0 -8px 32px rgba(0,0,0,0.12)" },
  tabs: { display: "flex", background: "#f1f5f9", borderRadius: 14, padding: 4, marginBottom: 24 },
  tab:  (active) => ({ flex: 1, padding: "11px 0", border: "none", borderRadius: 11, cursor: "pointer", fontSize: 14, fontWeight: 700, background: active ? "#fff" : "transparent", color: active ? "#4f46e5" : "#64748b", boxShadow: active ? "0 2px 8px rgba(0,0,0,0.1)" : "none" }),
  lbl:  { display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 },
  inp:  (err) => ({ width: "100%", padding: "13px 14px", border: `1.5px solid ${err ? "#ef4444" : "#e2e8f0"}`, borderRadius: 12, fontSize: 15, color: "#1a1d2e", background: "#fff", outline: "none", WebkitAppearance: "none", appearance: "none", boxSizing: "border-box" }),
  err:  { margin: "4px 0 0", fontSize: 12, color: "#ef4444" },
  fld:  { marginBottom: 18 },
  btn:  (loading) => ({ width: "100%", padding: "15px", background: loading ? "#a5b4fc" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(79,70,229,0.4)", marginTop: 8 }),
  alert: (type) => ({ background: type === "err" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${type === "err" ? "#fecaca" : "#bbf7d0"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: type === "err" ? "#dc2626" : "#16a34a", fontSize: 14, fontWeight: 500 }),
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode]     = useState("login");
  const [apiErr, setApiErr] = useState("");
  const [ok, setOk]         = useState("");
  const [busy, setBusy]     = useState(false);

  const [lf, setLf] = useState({ email: "", password: "" });
  const [le, setLe] = useState({ email: "", password: "" });
  const [lt, setLt] = useState({ email: false, password: false });

  const [rf, setRf] = useState({ name: "", email: "", password: "" });
  const [re, setRe] = useState({ name: "", email: "", password: "" });
  const [rt, setRt] = useState({ name: false, email: false, password: false });

  const vEmail = v => !v ? "Required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Invalid email" : "";
  const vPass  = (v, r) => !v ? "Required" : (r && v.length < 8) ? "Min 8 chars" : "";
  const vName  = v => !v?.trim() ? "Required" : "";

  const sw = m => { setMode(m); setApiErr(""); setOk(""); };

  const vlLogin = useCallback((n, v) => { const e = n==="email"?vEmail(v):vPass(v,false); setLe(p=>({...p,[n]:e})); return e; }, []);
  const vlReg   = useCallback((n, v) => { const e = n==="name"?vName(v):n==="email"?vEmail(v):vPass(v,true); setRe(p=>({...p,[n]:e})); return e; }, []);

  async function doLogin(e) {
    e.preventDefault(); setApiErr("");
    const ee=vEmail(lf.email), pe=vPass(lf.password,false);
    setLe({email:ee,password:pe}); setLt({email:true,password:true});
    if(ee||pe) return;
    setBusy(true);
    try { const r=await apiClient.post("/auth/login",{email:lf.email,password:lf.password}); login(r.data); navigate("/dashboard"); }
    catch(err) { setApiErr(err.response?.status===401?"Wrong email or password":err.response?.data?.detail||"Login failed"); }
    finally { setBusy(false); }
  }

  async function doReg(e) {
    e.preventDefault(); setApiErr("");
    const ne=vName(rf.name),ee=vEmail(rf.email),pe=vPass(rf.password,true);
    setRe({name:ne,email:ee,password:pe}); setRt({name:true,email:true,password:true});
    if(ne||ee||pe) return;
    setBusy(true);
    try {
      const r=await apiClient.post("/auth/register",{email:rf.email,password:rf.password,display_name:rf.name});
      if(r.data?.access_token){login(r.data);navigate("/dashboard");}
      else{setOk("Account created! Sign in.");sw("login");}
    }
    catch(err){setApiErr(err.response?.status===409?"Email already used":err.response?.data?.detail||"Failed");}
    finally{setBusy(false);}
  }

  return (
    <div style={S.page}>
      <div style={S.top}>
        <div style={{fontSize:52,marginBottom:8}}>💰</div>
        <h1 style={{margin:0,fontSize:26,fontWeight:800,color:"#fff"}}>Expense Manager</h1>
        <p style={{margin:"6px 0 0",color:"rgba(255,255,255,0.8)",fontSize:14}}>Track every rupee, every day</p>
      </div>
      <div style={S.card}>
        <div style={S.tabs}>
          <button style={S.tab(mode==="login")}    onClick={()=>sw("login")}>Sign In</button>
          <button style={S.tab(mode==="register")} onClick={()=>sw("register")}>Create Account</button>
        </div>
        {ok     && <div style={S.alert("ok")}>✓ {ok}</div>}
        {apiErr && <div style={S.alert("err")}>✕ {apiErr}</div>}
        {mode==="login" ? (
          <form onSubmit={doLogin} noValidate>
            <div style={S.fld}>
              <label style={S.lbl}>Email</label>
              <input type="email" value={lf.email} placeholder="you@example.com" style={S.inp(le.email&&lt.email)}
                onChange={e=>{setLf(p=>({...p,email:e.target.value}));if(lt.email)vlLogin("email",e.target.value);}}
                onBlur={e=>{setLt(p=>({...p,email:true}));vlLogin("email",e.target.value);}} autoComplete="email"/>
              {lt.email&&le.email&&<p style={S.err}>⚠ {le.email}</p>}
            </div>
            <div style={S.fld}>
              <label style={S.lbl}>Password</label>
              <input type="password" value={lf.password} placeholder="••••••••" style={S.inp(le.password&&lt.password)}
                onChange={e=>{setLf(p=>({...p,password:e.target.value}));if(lt.password)vlLogin("password",e.target.value);}}
                onBlur={e=>{setLt(p=>({...p,password:true}));vlLogin("password",e.target.value);}} autoComplete="current-password"/>
              {lt.password&&le.password&&<p style={S.err}>⚠ {le.password}</p>}
            </div>
            <button type="submit" disabled={busy} style={S.btn(busy)}>{busy?"Signing in...":"Sign In →"}</button>
          </form>
        ) : (
          <form onSubmit={doReg} noValidate>
            <div style={S.fld}>
              <label style={S.lbl}>Your name</label>
              <input type="text" value={rf.name} placeholder="Rahul Sharma" style={S.inp(re.name&&rt.name)}
                onChange={e=>{setRf(p=>({...p,name:e.target.value}));if(rt.name)vlReg("name",e.target.value);}}
                onBlur={e=>{setRt(p=>({...p,name:true}));vlReg("name",e.target.value);}} autoComplete="name"/>
              {rt.name&&re.name&&<p style={S.err}>⚠ {re.name}</p>}
            </div>
            <div style={S.fld}>
              <label style={S.lbl}>Email</label>
              <input type="email" value={rf.email} placeholder="you@example.com" style={S.inp(re.email&&rt.email)}
                onChange={e=>{setRf(p=>({...p,email:e.target.value}));if(rt.email)vlReg("email",e.target.value);}}
                onBlur={e=>{setRt(p=>({...p,email:true}));vlReg("email",e.target.value);}} autoComplete="email"/>
              {rt.email&&re.email&&<p style={S.err}>⚠ {re.email}</p>}
            </div>
            <div style={S.fld}>
              <label style={S.lbl}>Password (min 8 chars)</label>
              <input type="password" value={rf.password} placeholder="••••••••" style={S.inp(re.password&&rt.password)}
                onChange={e=>{setRf(p=>({...p,password:e.target.value}));if(rt.password)vlReg("password",e.target.value);}}
                onBlur={e=>{setRt(p=>({...p,password:true}));vlReg("password",e.target.value);}} autoComplete="new-password"/>
              {rt.password&&re.password&&<p style={S.err}>⚠ {re.password}</p>}
            </div>
            <button type="submit" disabled={busy} style={S.btn(busy)}>{busy?"Creating...":"Create Account →"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
