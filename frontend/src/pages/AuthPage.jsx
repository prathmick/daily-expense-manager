import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db, getSetting, setSetting } from "../db/database";

// Simple hash for local password (not cryptographic, just obfuscation)
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "expense-salt-2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

const S = {
  page: { minHeight: "100dvh", background: "linear-gradient(160deg,#4f46e5 0%,#7c3aed 45%,#f0f2f7 45%)", display: "flex", flexDirection: "column" },
  top:  { padding: "52px 24px 28px", textAlign: "center" },
  card: { flex: 1, background: "#fff", borderRadius: "28px 28px 0 0", padding: "28px 20px 48px", boxShadow: "0 -8px 32px rgba(0,0,0,0.12)" },
  tabs: { display: "flex", background: "#f1f5f9", borderRadius: 14, padding: 4, marginBottom: 24 },
  tab:  (a) => ({ flex: 1, padding: "11px 0", border: "none", borderRadius: 11, cursor: "pointer", fontSize: 14, fontWeight: 700, background: a ? "#fff" : "transparent", color: a ? "#4f46e5" : "#64748b", boxShadow: a ? "0 2px 8px rgba(0,0,0,0.1)" : "none" }),
  lbl:  { display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 },
  inp:  (err) => ({ width: "100%", padding: "13px 14px", border: `1.5px solid ${err ? "#ef4444" : "#e2e8f0"}`, borderRadius: 12, fontSize: 15, color: "#1a1d2e", background: "#fff", outline: "none", WebkitAppearance: "none", appearance: "none", boxSizing: "border-box" }),
  err:  { margin: "4px 0 0", fontSize: 12, color: "#ef4444" },
  fld:  { marginBottom: 18 },
  btn:  (loading) => ({ width: "100%", padding: "15px", background: loading ? "#a5b4fc" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(79,70,229,0.4)", marginTop: 8 }),
  alert: (t) => ({ background: t === "err" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${t === "err" ? "#fecaca" : "#bbf7d0"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: t === "err" ? "#dc2626" : "#16a34a", fontSize: 14, fontWeight: 500 }),
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode]   = useState("login");
  const [error, setError] = useState("");
  const [ok, setOk]       = useState("");
  const [busy, setBusy]   = useState(false);

  const [lf, setLf] = useState({ name: "", password: "" });
  const [rf, setRf] = useState({ name: "", password: "", confirm: "" });

  const sw = m => { setMode(m); setError(""); setOk(""); };

  async function doLogin(e) {
    e.preventDefault(); setError("");
    if (!lf.name.trim()) { setError("Name is required"); return; }
    if (!lf.password)    { setError("Password is required"); return; }
    setBusy(true);
    try {
      // Get stored accounts
      const accounts = await getSetting("accounts", {});
      const key = lf.name.trim().toLowerCase();
      if (!accounts[key]) { setError("No account found with this name. Please register first."); return; }
      const hashed = await hashPin(lf.password);
      if (accounts[key].passwordHash !== hashed) { setError("Wrong password"); return; }
      await login({ name: accounts[key].displayName, key });
      navigate("/dashboard");
    } catch { setError("Login failed. Try again."); }
    finally { setBusy(false); }
  }

  async function doRegister(e) {
    e.preventDefault(); setError("");
    if (!rf.name.trim())       { setError("Name is required"); return; }
    if (rf.password.length < 4) { setError("Password must be at least 4 characters"); return; }
    if (rf.password !== rf.confirm) { setError("Passwords don't match"); return; }
    setBusy(true);
    try {
      const accounts = await getSetting("accounts", {});
      const key = rf.name.trim().toLowerCase();
      if (accounts[key]) { setError("An account with this name already exists"); return; }
      const hashed = await hashPin(rf.password);
      accounts[key] = { displayName: rf.name.trim(), passwordHash: hashed };
      await setSetting("accounts", accounts);
      setOk(`Account created! Welcome, ${rf.name.trim()}. Please sign in.`);
      sw("login");
      setLf({ name: rf.name.trim(), password: "" });
    } catch { setError("Registration failed. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <div style={S.page}>
      <div style={S.top}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>💰</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#fff" }}>Expense Manager</h1>
        <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Your data, your phone, offline</p>
      </div>
      <div style={S.card}>
        <div style={S.tabs}>
          <button style={S.tab(mode === "login")}    onClick={() => sw("login")}>Sign In</button>
          <button style={S.tab(mode === "register")} onClick={() => sw("register")}>Create Account</button>
        </div>

        {ok    && <div style={S.alert("ok")}>✓ {ok}</div>}
        {error && <div style={S.alert("err")}>✕ {error}</div>}

        {mode === "login" ? (
          <form onSubmit={doLogin} noValidate>
            <div style={S.fld}>
              <label style={S.lbl}>Your name</label>
              <input type="text" value={lf.name} placeholder="Rahul Sharma" style={S.inp(false)}
                onChange={e => setLf(p => ({ ...p, name: e.target.value }))} autoComplete="username" />
            </div>
            <div style={S.fld}>
              <label style={S.lbl}>Password</label>
              <input type="password" value={lf.password} placeholder="••••" style={S.inp(false)}
                onChange={e => setLf(p => ({ ...p, password: e.target.value }))} autoComplete="current-password" />
            </div>
            <button type="submit" disabled={busy} style={S.btn(busy)}>{busy ? "Signing in..." : "Sign In →"}</button>
          </form>
        ) : (
          <form onSubmit={doRegister} noValidate>
            <div style={S.fld}>
              <label style={S.lbl}>Your name</label>
              <input type="text" value={rf.name} placeholder="Rahul Sharma" style={S.inp(false)}
                onChange={e => setRf(p => ({ ...p, name: e.target.value }))} autoComplete="name" />
            </div>
            <div style={S.fld}>
              <label style={S.lbl}>Password (min 4 chars)</label>
              <input type="password" value={rf.password} placeholder="••••" style={S.inp(false)}
                onChange={e => setRf(p => ({ ...p, password: e.target.value }))} autoComplete="new-password" />
            </div>
            <div style={S.fld}>
              <label style={S.lbl}>Confirm password</label>
              <input type="password" value={rf.confirm} placeholder="••••" style={S.inp(false)}
                onChange={e => setRf(p => ({ ...p, confirm: e.target.value }))} autoComplete="new-password" />
            </div>
            <button type="submit" disabled={busy} style={S.btn(busy)}>{busy ? "Creating..." : "Create Account →"}</button>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 20 }}>
          🔒 All data stored locally on your device. No internet required.
        </p>
      </div>
    </div>
  );
}
