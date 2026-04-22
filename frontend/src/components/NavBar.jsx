import { useState } from "react";
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
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() { logout(); navigate("/auth"); }

  return (
    <>
      <style>{`
        /* ── Top navbar (desktop) ── */
        .top-navbar {
          position: sticky; top: 0; z-index: 100;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
          padding: 0 24px;
          display: flex; align-items: center; justify-content: space-between;
          height: 60px;
        }
        .top-navbar-brand {
          font-weight: 800; font-size: 1.15rem;
          background: linear-gradient(135deg,#4f46e5,#7c3aed);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; text-decoration: none;
          display: flex; align-items: center; gap: 8px;
        }
        .top-navbar-links {
          display: flex; align-items: center; gap: 4px;
          list-style: none; margin: 0; padding: 0;
        }
        .top-navbar-links a {
          padding: 7px 14px; border-radius: 10px;
          text-decoration: none; color: #64748b;
          font-size: 14px; font-weight: 500;
          transition: all 0.15s; display: flex; align-items: center; gap: 6px;
        }
        .top-navbar-links a:hover { background: #f1f5f9; color: #1a1d2e; }
        .top-navbar-links a.active {
          background: linear-gradient(135deg,#ede9fe,#ddd6fe);
          color: #4f46e5; font-weight: 600;
        }
        .top-navbar-logout {
          padding: 7px 16px; border-radius: 10px; border: none;
          background: #fef2f2; color: #dc2626;
          font-size: 14px; font-weight: 500; cursor: pointer;
          transition: background 0.15s;
        }
        .top-navbar-logout:hover { background: #fee2e2; }
        .top-navbar-hamburger {
          display: none; background: none; border: none;
          font-size: 1.4rem; cursor: pointer; color: #374151; padding: 4px;
        }
        .top-navbar-dropdown {
          position: absolute; top: 60px; left: 0; right: 0;
          background: #fff; border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          padding: 12px 16px; display: flex; flex-direction: column; gap: 4px;
          z-index: 99;
        }
        .top-navbar-dropdown a {
          padding: 12px 14px; border-radius: 12px;
          text-decoration: none; color: #374151;
          font-size: 15px; font-weight: 500;
          display: flex; align-items: center; gap: 10px;
          transition: background 0.15s;
        }
        .top-navbar-dropdown a:hover { background: #f8fafc; }
        .top-navbar-dropdown a.active { background: #ede9fe; color: #4f46e5; font-weight: 600; }
        .top-navbar-dropdown-logout {
          padding: 12px 14px; border-radius: 12px; border: none;
          background: none; color: #dc2626; font-size: 15px; font-weight: 500;
          cursor: pointer; text-align: left; display: flex; align-items: center; gap: 10px;
        }
        .top-navbar-dropdown-logout:hover { background: #fef2f2; }

        @media (max-width: 767px) {
          .top-navbar-hamburger { display: block; }
          .top-navbar-desktop { display: none !important; }
          .top-navbar { display: none !important; }
        }
      `}</style>

      {/* Top navbar */}
      <nav className="top-navbar">
        <Link to="/dashboard" className="top-navbar-brand">
          <span>💰</span> Expense Manager
        </Link>
        <ul className="top-navbar-links top-navbar-desktop">
          {navLinks.map(({ label, path, icon }) => (
            <li key={path}>
              <Link to={path} className={location.pathname === path ? "active" : ""}>
                <span>{icon}</span>{label}
              </Link>
            </li>
          ))}
          <li>
            <button className="top-navbar-logout" onClick={handleLogout}>Sign out</button>
          </li>
        </ul>
        <button className="top-navbar-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="top-navbar-dropdown">
          {navLinks.map(({ label, path, icon }) => (
            <Link key={path} to={path}
              className={location.pathname === path ? "active" : ""}
              onClick={() => setMenuOpen(false)}>
              <span>{icon}</span>{label}
            </Link>
          ))}
          <button className="top-navbar-dropdown-logout" onClick={handleLogout}>
            <span>🚪</span> Sign out
          </button>
        </div>
      )}

      {/* Bottom nav (mobile only) */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {navLinks.map(({ label, path, icon }) => (
            <Link key={path} to={path}
              className={`bottom-nav-item ${location.pathname === path ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
          <button className="bottom-nav-item" onClick={handleLogout}>
            <span style={{ fontSize: 22 }}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
