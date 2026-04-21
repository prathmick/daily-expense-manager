import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import AuthPage from "./pages/AuthPage";
import ExpenseListPage from "./pages/ExpenseListPage";
import DashboardPage from "./pages/DashboardPage";
import ReportPage from "./pages/ReportPage";
import BudgetPage from "./pages/BudgetPage";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/auth" replace />;
}

function PrivateLayout({ children }) {
  return (
    <>
      <NavBar />
      <main>{children}</main>
    </>
  );
}

function RootRedirect() {
  const { token } = useAuth();
  return <Navigate to={token ? "/dashboard" : "/auth"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <PrivateLayout>
              <DashboardPage />
            </PrivateLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <PrivateRoute>
            <PrivateLayout>
              <ExpenseListPage />
            </PrivateLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <PrivateLayout>
              <ReportPage />
            </PrivateLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <PrivateRoute>
            <PrivateLayout>
              <BudgetPage />
            </PrivateLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
