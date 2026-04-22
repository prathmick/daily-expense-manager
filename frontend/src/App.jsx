import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ExpenseListPage from "./pages/ExpenseListPage";
import ReportPage from "./pages/ReportPage";
import BudgetPage from "./pages/BudgetPage";

const NAV = [
  { path: "/dashboard", label: "Home",     icon: "🏠" },
  { path: "/expenses",  label: "Expenses", icon: "💸" },
  { path: "/reports",   label: "Reports",  icon: "📊" },
  { path: "/budgets",   label: "Budgets",  icon: "🎯" },
];

function BottomNav() {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999,
      background: "#fff", borderTop: "1px solid #e5e7eb",
      display: "flex", alignItems: "stretch",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
    }}>
      {NAV.map(({ path, label, icon }) => {
        const active = location.pathname === path;
        return (
          <button key={path} onClick={() => navigate(path)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 3, padding: "10px 4px",
            background: "none", border: "none", cursor: "pointer",
            color: active ? "#4f46e5" : "#9ca3af",
            fontSize: 10, fontWeight: active ? 700 : 500,
          }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
            <span>{label}</span>
          </button>
        );
      })}
      <button onClick={() => { logout(); navigate("/auth"); }} style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 3, padding: "10px 4px",
        background: "none", border: "none", cursor: "pointer",
        color: "#9ca3af", fontSize: 10, fontWeight: 500,
      }}>
        <span style={{ fontSize: 24, lineHeight: 1 }}>🚪</span>
        <span>Logout</span>
      </button>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/auth" replace />;
  return (
    <div style={{ width: "100%", minHeight: "100vh", paddingBottom: 72 }}>
      {children}
      <BottomNav />
    </div>
  );
}

function AppRoutes() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? "/dashboard" : "/auth"} replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/expenses"  element={<PrivateRoute><ExpenseListPage /></PrivateRoute>} />
      <Route path="/reports"   element={<PrivateRoute><ReportPage /></PrivateRoute>} />
      <Route path="/budgets"   element={<PrivateRoute><BudgetPage /></PrivateRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
