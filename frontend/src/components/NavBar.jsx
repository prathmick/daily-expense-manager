import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { label: "Dashboard", path: "/dashboard", icon: "📊" },
  { label: "Expenses",  path: "/expenses",  icon: "💸" },
  { label: "Reports",   path: "/reports",   icon: "📈" },
  { label: "Budgets",   path: "/budgets",   icon: "🎯" },
];

export default function NavBar() {
  const { logout } = useAuth();
  const location   = useLocation();
  const navigate   = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  function handleLogout() { logout(); navigate("/auth"); }

  // ── Mobile: bottom tab bar only ──────────────────────────────────────────
  if (isMobile) {
    return (
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 0 env(safe-area-inset-bottom, 8px)",
        zIndex: 999,
        boxShadow: "0 -2px 16px rgba(0,0,0,0.08)",
      }}>
        {navLinks.map(({ label, path, icon }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 3, textDecoration: "none",
              color: active ? "#4f46e5" : "#94a3b8",
              fontSize: 10, fontWeight: active ? 700 : 500,
              padding: "4px 12px",
              minWidth: 56,
            }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
        <button onClick={handleLogout} style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 3, background: "none", border: "none", cursor: "pointer",
          color: "#94a3b8", fontSize: 10, fontWeight: 500, padding: "4px 12px", minWidth: 56,
        }}>
          <span style={{ fontSize: 22 }}>🚪</span>
          <span>Logout</span>
        </button>
      </nav>
    );
  }

  // ── Desktop: top navbar ──────────────────────────────────────────────────
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "#fff", borderBottom: "1px solid #e2e8f0",
      boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      padding: "0 24px", display: "flex",
      alignItems: "center", justifyContent: "space-between", height: 60,
    }}>
      <Link to="/dashboard" style={{
        fontWeight: 800, fontSize: "1.1rem", textDecoration: "none",
        background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        💰 Expense Manager
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {navLinks.map(({ label, path, icon }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} style={{
              padding: "7px 14px", borderRadius: 10, textDecoration: "none",
              color: active ? "#4f46e5" : "#64748b",
              background: active ? "#ede9fe" : "transparent",
              fontSize: 14, fontWeight: active ? 700 : 500,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {icon} {label}
            </Link>
          );
        })}
        <button onClick={handleLogout} style={{
          padding: "7px 16px", borderRadius: 10, border: "none",
          background: "#fef2f2", color: "#dc2626",
          fontSize: 14, fontWeight: 500, cursor: "pointer", marginLeft: 8,
        }}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
