import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/apiClient";

function validateEmail(v) {
  if (!v) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email";
  return "";
}
function validatePassword(v, isReg) {
  if (!v) return "Password is required";
  if (isReg && v.length < 8) return "At least 8 characters";
  return "";
}
function validateName(v) {
  if (!v?.trim()) return "Name is required";
  return "";
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode]       = useState("login");
  const [apiError, setApiError] = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const [lf, setLf] = useState({ email: "", password: "" });
  const [le, setLe] = useState({ email: "", password: "" });
  const [lt, setLt] = useState({ email: false, password: false });

  const [rf, setRf] = useState({ name: "", email: "", password: "" });
  const [re, setRe] = useState({ name: "", email: "", password: "" });
  const [rt, setRt] = useState({ name: false, email: false, password: false });

  const switchMode = (m) => { setMode(m); setApiError(""); setSuccess(""); };

  const validateLogin = useCallback((name, val) => {
    const err = name === "email" ? validateEmail(val) : validatePassword(val, false);
    setLe(p => ({ ...p, [name]: err })); return err;
  }, []);

  const validateReg = useCallback((name, val) => {
    const err = name === "name" ? validateName(val) : name === "email" ? validateEmail(val) : validatePassword(val, true);
    setRe(p => ({ ...p, [name]: err })); return err;
  }, []);

  async function handleLogin(e) {
    e.preventDefault(); setApiError("");
    const ee = validateEmail(lf.email), pe = validatePassword(lf.password, false);
    setLe({ email: ee, password: pe }); setLt({ email: true, password: true });
    if (ee || pe) return;
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", { email: lf.email, password: lf.password });
      login(res.data); navigate("/dashboard");
    } catch (err) {
      setApiError(err.response?.status === 401 ? "Invalid email or password" : err.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault(); setApiError("");
    const ne = validateName(rf.name), ee = validateEmail(rf.email), pe = validatePassword(rf.password, true);
    setRe({ name: ne, email: ee, password: pe }); setRt({ name: true, email: true, password: true });
    if (ne || ee || pe) return;
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/register", { email: rf.email, password: rf.password, display_name: rf.name });
      if (res.data?.access_token) { login(res.data); navigate("/dashboard"); }
      else { setSuccess("Account created! Please log in."); switchMode("login"); }
    } catch (err) {
      setApiError(err.response?.status === 409 ? "Email already registered" : err.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  }

  const inp = (err, touched) => ({
    width: "100%", padding: "12px 14px",
    border: `1.5px solid ${err && touched ? "#ef4444" : "#e2e8f0"}`,
    borderRadius: 12, fontSize: 15, color: "#1a1d2e",
    background: "#fff", outline: "none", boxSizing: "border-box",
    WebkitAppearance: "none", appearance: "none",
  });

  const labelSt = { display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 };
  const fieldSt = { marginBottom: 16 };
  const errSt   = { margin: "4px 0 0", fontSize: 12, color: "#ef4444" };

  const btnSt = {
    width: "100%", padding: "14px",
    background: loading ? "#a5b4fc" : "linear-gradient(135deg,#4f46e5,#7c3aed)",
    color: "#fff", border: "none", borderRadius: 14,
    fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
    boxShadow: "0 4px 14px rgba(79,70,229,0.35)", marginTop: 8,
  };

  // Mobile: full screen layout
  if (isMobile) {
    return (
      <div style={{
        minHeight: "100vh", minHeight: "100dvh",
        background: "linear-gradient(160deg,#4f46e5 0%,#7c3aed 40%,#f0f2f7 40%)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Top branding */}
        <div style={{ padding: "48px 24px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>💰</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#fff" }}>Expense Manager</h1>
          <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Track every rupee, every day</p>
        </div>

        {/* Card fills rest of screen */}
        <div style={{
          flex: 1, background: "#fff",
          borderRadius: "28px 28px 0 0",
          padding: "28px 20px 40px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        }}>
          {/* Tab switcher */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 14, padding: 4, marginBottom: 24 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: "10px 0", border: "none", borderRadius: 11, cursor: "pointer",
                fontSize: 14, fontWeight: 700, transition: "all 0.2s",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#4f46e5" : "#64748b",
                boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
              }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {success  && <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"10px 14px", marginBottom:16, color:"#16a34a", fontSize:14, fontWeight:500 }}>✓ {success}</div>}
          {apiError && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:16, color:"#dc2626", fontSize:14, fontWeight:500 }}>✕ {apiError}</div>}

          {mode === "login" ? (
            <form onSubmit={handleLogin} noValidate>
              <div style={fieldSt}>
                <label style={labelSt}>Email address</label>
                <input type="email" value={lf.email} placeholder="you@example.com"
                  style={inp(le.email, lt.email)}
                  onChange={e => { setLf(p=>({...p,email:e.target.value})); if(lt.email) validateLogin("email",e.target.value); }}
                  onBlur={e => { setLt(p=>({...p,email:true})); validateLogin("email",e.target.value); }}
                  autoComplete="email" />
                {lt.email && le.email && <p style={errSt}>⚠ {le.email}</p>}
              </div>
              <div style={fieldSt}>
                <label style={labelSt}>Password</label>
                <input type="password" value={lf.password} placeholder="••••••••"
                  style={inp(le.password, lt.password)}
                  onChange={e => { setLf(p=>({...p,password:e.target.value})); if(lt.password) validateLogin("password",e.target.value); }}
                  onBlur={e => { setLt(p=>({...p,password:true})); validateLogin("password",e.target.value); }}
                  autoComplete="current-password" />
                {lt.password && le.password && <p style={errSt}>⚠ {le.password}</p>}
              </div>
              <button type="submit" disabled={loading} style={btnSt}>{loading ? "Signing in..." : "Sign In →"}</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} noValidate>
              <div style={fieldSt}>
                <label style={labelSt}>Your name</label>
                <input type="text" value={rf.name} placeholder="Rahul Sharma"
                  style={inp(re.name, rt.name)}
                  onChange={e => { setRf(p=>({...p,name:e.target.value})); if(rt.name) validateReg("name",e.target.value); }}
                  onBlur={e => { setRt(p=>({...p,name:true})); validateReg("name",e.target.value); }}
                  autoComplete="name" />
                {rt.name && re.name && <p style={errSt}>⚠ {re.name}</p>}
              </div>
              <div style={fieldSt}>
                <label style={labelSt}>Email address</label>
                <input type="email" value={rf.email} placeholder="you@example.com"
                  style={inp(re.email, rt.email)}
                  onChange={e => { setRf(p=>({...p,email:e.target.value})); if(rt.email) validateReg("email",e.target.value); }}
                  onBlur={e => { setRt(p=>({...p,email:true})); validateReg("email",e.target.value); }}
                  autoComplete="email" />
                {rt.email && re.email && <p style={errSt}>⚠ {re.email}</p>}
              </div>
              <div style={fieldSt}>
                <label style={labelSt}>Password (min 8 chars)</label>
                <input type="password" value={rf.password} placeholder="••••••••"
                  style={inp(re.password, rt.password)}
                  onChange={e => { setRf(p=>({...p,password:e.target.value})); if(rt.password) validateReg("password",e.target.value); }}
                  onBlur={e => { setRt(p=>({...p,password:true})); validateReg("password",e.target.value); }}
                  autoComplete="new-password" />
                {rt.password && re.password && <p style={errSt}>⚠ {re.password}</p>}
              </div>
              <button type="submit" disabled={loading} style={btnSt}>{loading ? "Creating account..." : "Create Account →"}</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#667eea,#764ba2)", padding:24 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>💰</div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:"#fff" }}>Expense Manager</h1>
          <p style={{ margin:"6px 0 0", color:"rgba(255,255,255,0.75)", fontSize:14 }}>Track every rupee, every day</p>
        </div>
        <div style={{ background:"#fff", borderRadius:24, padding:"32px 28px", boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}>
          <div style={{ display:"flex", background:"#f1f5f9", borderRadius:14, padding:4, marginBottom:28 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex:1, padding:"10px 0", border:"none", borderRadius:11, cursor:"pointer",
                fontSize:14, fontWeight:700, background:mode===m?"#fff":"transparent",
                color:mode===m?"#4f46e5":"#64748b",
                boxShadow:mode===m?"0 2px 8px rgba(0,0,0,0.1)":"none",
              }}>{m==="login"?"Sign In":"Create Account"}</button>
            ))}
          </div>
          {success  && <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"10px 14px", marginBottom:16, color:"#16a34a", fontSize:14 }}>✓ {success}</div>}
          {apiError && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:16, color:"#dc2626", fontSize:14 }}>✕ {apiError}</div>}
          {mode === "login" ? (
            <form onSubmit={handleLogin} noValidate>
              <div style={fieldSt}><label style={labelSt}>Email</label>
                <input type="email" value={lf.email} placeholder="you@example.com" style={inp(le.email,lt.email)}
                  onChange={e=>{setLf(p=>({...p,email:e.target.value}));if(lt.email)validateLogin("email",e.target.value);}}
                  onBlur={e=>{setLt(p=>({...p,email:true}));validateLogin("email",e.target.value);}} autoComplete="email"/>
                {lt.email&&le.email&&<p style={errSt}>⚠ {le.email}</p>}
              </div>
              <div style={fieldSt}><label style={labelSt}>Password</label>
                <input type="password" value={lf.password} placeholder="••••••••" style={inp(le.password,lt.password)}
                  onChange={e=>{setLf(p=>({...p,password:e.target.value}));if(lt.password)validateLogin("password",e.target.value);}}
                  onBlur={e=>{setLt(p=>({...p,password:true}));validateLogin("password",e.target.value);}} autoComplete="current-password"/>
                {lt.password&&le.password&&<p style={errSt}>⚠ {le.password}</p>}
              </div>
              <button type="submit" disabled={loading} style={btnSt}>{loading?"Signing in...":"Sign In →"}</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} noValidate>
              <div style={fieldSt}><label style={labelSt}>Name</label>
                <input type="text" value={rf.name} placeholder="Rahul Sharma" style={inp(re.name,rt.name)}
                  onChange={e=>{setRf(p=>({...p,name:e.target.value}));if(rt.name)validateReg("name",e.target.value);}}
                  onBlur={e=>{setRt(p=>({...p,name:true}));validateReg("name",e.target.value);}} autoComplete="name"/>
                {rt.name&&re.name&&<p style={errSt}>⚠ {re.name}</p>}
              </div>
              <div style={fieldSt}><label style={labelSt}>Email</label>
                <input type="email" value={rf.email} placeholder="you@example.com" style={inp(re.email,rt.email)}
                  onChange={e=>{setRf(p=>({...p,email:e.target.value}));if(rt.email)validateReg("email",e.target.value);}}
                  onBlur={e=>{setRt(p=>({...p,email:true}));validateReg("email",e.target.value);}} autoComplete="email"/>
                {rt.email&&re.email&&<p style={errSt}>⚠ {re.email}</p>}
              </div>
              <div style={fieldSt}><label style={labelSt}>Password (min 8)</label>
                <input type="password" value={rf.password} placeholder="••••••••" style={inp(re.password,rt.password)}
                  onChange={e=>{setRf(p=>({...p,password:e.target.value}));if(rt.password)validateReg("password",e.target.value);}}
                  onBlur={e=>{setRt(p=>({...p,password:true}));validateReg("password",e.target.value);}} autoComplete="new-password"/>
                {rt.password&&re.password&&<p style={errSt}>⚠ {re.password}</p>}
              </div>
              <button type="submit" disabled={loading} style={btnSt}>{loading?"Creating...":"Create Account →"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
