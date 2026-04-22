import { useState, useCallback } from "react";
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

function Field({ label, id, error, touched, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {touched && error && (
        <p style={{ margin: "5px 0 0", fontSize: 12, color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [lf, setLf] = useState({ email: "", password: "" });
  const [le, setLe] = useState({ email: "", password: "" });
  const [lt, setLt] = useState({ email: false, password: false });

  const [rf, setRf] = useState({ name: "", email: "", password: "" });
  const [re, setRe] = useState({ name: "", email: "", password: "" });
  const [rt, setRt] = useState({ name: false, email: false, password: false });

  const switchMode = (m) => { setMode(m); setApiError(""); setSuccess(""); };

  const validateLogin = useCallback((name, val) => {
    const err = name === "email" ? validateEmail(val) : validatePassword(val, false);
    setLe(p => ({ ...p, [name]: err }));
    return err;
  }, []);

  const validateReg = useCallback((name, val) => {
    const err = name === "name" ? validateName(val) : name === "email" ? validateEmail(val) : validatePassword(val, true);
    setRe(p => ({ ...p, [name]: err }));
    return err;
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setApiError("");
    const ee = validateEmail(lf.email), pe = validatePassword(lf.password, false);
    setLe({ email: ee, password: pe });
    setLt({ email: true, password: true });
    if (ee || pe) return;
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", { email: lf.email, password: lf.password });
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setApiError(err.response?.status === 401 ? "Invalid email or password" : err.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setApiError("");
    const ne = validateName(rf.name), ee = validateEmail(rf.email), pe = validatePassword(rf.password, true);
    setRe({ name: ne, email: ee, password: pe });
    setRt({ name: true, email: true, password: true });
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

  const inputCls = (err, touched) => `form-input${err && touched ? " error" : ""}`;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "16px",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 44, marginBottom: 6 }}>💰</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>Expense Manager</h1>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Track every rupee, every day</p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 28 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: "9px 0", border: "none", borderRadius: 10, cursor: "pointer",
                fontSize: 14, fontWeight: 600, transition: "all 0.2s",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#4f46e5" : "#64748b",
                boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
              }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {success && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 20, color: "#16a34a", fontSize: 14, fontWeight: 500 }}>
              ✓ {success}
            </div>
          )}
          {apiError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 20, color: "#dc2626", fontSize: 14, fontWeight: 500 }}>
              ✕ {apiError}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} noValidate>
              <Field label="Email address" id="l-email" error={le.email} touched={lt.email}>
                <input id="l-email" className={inputCls(le.email, lt.email)} type="email" name="email"
                  value={lf.email} placeholder="you@example.com"
                  onChange={e => { setLf(p => ({ ...p, email: e.target.value })); if (lt.email) validateLogin("email", e.target.value); }}
                  onBlur={e => { setLt(p => ({ ...p, email: true })); validateLogin("email", e.target.value); }}
                  autoComplete="email" />
              </Field>
              <Field label="Password" id="l-pass" error={le.password} touched={lt.password}>
                <input id="l-pass" className={inputCls(le.password, lt.password)} type="password" name="password"
                  value={lf.password} placeholder="••••••••"
                  onChange={e => { setLf(p => ({ ...p, password: e.target.value })); if (lt.password) validateLogin("password", e.target.value); }}
                  onBlur={e => { setLt(p => ({ ...p, password: true })); validateLogin("password", e.target.value); }}
                  autoComplete="current-password" />
              </Field>
              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "13px", marginTop: 8,
                background: loading ? "#a5b4fc" : "linear-gradient(135deg,#4f46e5,#7c3aed)",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(79,70,229,0.35)", transition: "opacity 0.15s",
              }}>
                {loading ? "Signing in..." : "Sign In →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} noValidate>
              <Field label="Your name" id="r-name" error={re.name} touched={rt.name}>
                <input id="r-name" className={inputCls(re.name, rt.name)} type="text" name="name"
                  value={rf.name} placeholder="Rahul Sharma"
                  onChange={e => { setRf(p => ({ ...p, name: e.target.value })); if (rt.name) validateReg("name", e.target.value); }}
                  onBlur={e => { setRt(p => ({ ...p, name: true })); validateReg("name", e.target.value); }}
                  autoComplete="name" />
              </Field>
              <Field label="Email address" id="r-email" error={re.email} touched={rt.email}>
                <input id="r-email" className={inputCls(re.email, rt.email)} type="email" name="email"
                  value={rf.email} placeholder="you@example.com"
                  onChange={e => { setRf(p => ({ ...p, email: e.target.value })); if (rt.email) validateReg("email", e.target.value); }}
                  onBlur={e => { setRt(p => ({ ...p, email: true })); validateReg("email", e.target.value); }}
                  autoComplete="email" />
              </Field>
              <Field label="Password (min 8 chars)" id="r-pass" error={re.password} touched={rt.password}>
                <input id="r-pass" className={inputCls(re.password, rt.password)} type="password" name="password"
                  value={rf.password} placeholder="••••••••"
                  onChange={e => { setRf(p => ({ ...p, password: e.target.value })); if (rt.password) validateReg("password", e.target.value); }}
                  onBlur={e => { setRt(p => ({ ...p, password: true })); validateReg("password", e.target.value); }}
                  autoComplete="new-password" />
              </Field>
              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "13px", marginTop: 8,
                background: loading ? "#a5b4fc" : "linear-gradient(135deg,#4f46e5,#7c3aed)",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
              }}>
                {loading ? "Creating account..." : "Create Account →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
