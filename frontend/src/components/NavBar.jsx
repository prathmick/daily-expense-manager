import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Expenses", path: "/expenses" },
  { label: "Reports", path: "/reports" },
  { label: "Budgets", path: "/budgets" },
];

export default function NavBar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  return (
    <>
      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
        }
        .navbar-brand {
          font-weight: 700;
          font-size: 1.1rem;
          color: #4f46e5;
          text-decoration: none;
        }
        .navbar-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .navbar-links a {
          padding: 0.4rem 0.85rem;
          border-radius: 6px;
          text-decoration: none;
          color: #374151;
          font-size: 0.95rem;
          transition: background 0.15s;
        }
        .navbar-links a:hover {
          background: #f3f4f6;
        }
        .navbar-links a.active {
          background: #ede9fe;
          color: #4f46e5;
          font-weight: 600;
        }
        .navbar-logout {
          padding: 0.4rem 0.85rem;
          border-radius: 6px;
          border: none;
          background: none;
          color: #ef4444;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .navbar-logout:hover {
          background: #fee2e2;
        }
        .navbar-hamburger {
          display: none;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #374151;
          padding: 0.25rem;
        }
        @media (max-width: 767px) {
          .navbar-hamburger {
            display: block;
          }
          .navbar-desktop {
            display: none;
          }
          .navbar-dropdown {
            position: absolute;
            top: 56px;
            left: 0;
            right: 0;
            background: #fff;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            padding: 0.5rem 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          .navbar-dropdown a {
            padding: 0.6rem 0.85rem;
            border-radius: 6px;
            text-decoration: none;
            color: #374151;
            font-size: 0.95rem;
          }
          .navbar-dropdown a:hover {
            background: #f3f4f6;
          }
          .navbar-dropdown a.active {
            background: #ede9fe;
            color: #4f46e5;
            font-weight: 600;
          }
          .navbar-dropdown-logout {
            padding: 0.6rem 0.85rem;
            border-radius: 6px;
            border: none;
            background: none;
            color: #ef4444;
            font-size: 0.95rem;
            cursor: pointer;
            text-align: left;
          }
          .navbar-dropdown-logout:hover {
            background: #fee2e2;
          }
        }
      `}</style>

      <nav className="navbar">
        <Link to="/dashboard" className="navbar-brand">💰 Expense Manager</Link>

        {/* Desktop nav */}
        <ul className="navbar-links navbar-desktop">
          {navLinks.map(({ label, path }) => (
            <li key={path}>
              <Link to={path} className={location.pathname === path ? "active" : ""}>
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button className="navbar-logout" onClick={handleLogout}>Logout</button>
          </li>
        </ul>

        {/* Hamburger button (mobile) */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div className="navbar-dropdown">
          {navLinks.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              className={location.pathname === path ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <button className="navbar-dropdown-logout" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </>
  );
}
