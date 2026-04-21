import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/apiClient";

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    padding: "32px",
    width: "100%",
    maxWidth: "400px",
  },
  tabs: {
    display: "flex",
    marginBottom: "24px",
    borderBottom: "2px solid #e0e0e0",
  },
  tab: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    color: "#666",
    borderBottom: "2px solid transparent",
    marginBottom: "-2px",
  },
  activeTab: {
    color: "#1976d2",
    borderBottom: "2px solid #1976d2",
  },
  field: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "4px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  inputError: {
    borderColor: "#d32f2f",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: "12px",
    marginTop: "4px",
  },
  successText: {
    color: "#388e3c",
    fontSize: "14px",
    marginBottom: "12px",
    textAlign: "center",
  },
  apiError: {
    color: "#d32f2f",
    fontSize: "14px",
    marginBottom: "12px",
    textAlign: "center",
  },
  submitBtn: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "8px",
  },
  submitBtnDisabled: {
    backgroundColor: "#90caf9",
    cursor: "not-allowed",
  },
};

function validateEmail(value) {
  if (!value) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Must be a valid email address";
  return "";
}

function validatePassword(value, isRegister) {
  if (!value) return "Password is required";
  if (isRegister && value.length < 8) return "Password must be at least 8 characters";
  return "";
}

function validateDisplayName(value) {
  if (!value || !value.trim()) return "Display name is required";
  return "";
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginFields, setLoginFields] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState({ email: "", password: "" });
  const [loginTouched, setLoginTouched] = useState({ email: false, password: false });

  // Register form state
  const [regFields, setRegFields] = useState({ displayName: "", email: "", password: "" });
  const [regErrors, setRegErrors] = useState({ displayName: "", email: "", password: "" });
  const [regTouched, setRegTouched] = useState({ displayName: false, email: false, password: false });

  const switchMode = (newMode) => {
    setMode(newMode);
    setApiError("");
    setSuccessMessage("");
  };

  // --- Login handlers ---
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginFields((prev) => ({ ...prev, [name]: value }));
    if (loginTouched[name]) {
      validateLoginField(name, value);
    }
  };

  const validateLoginField = useCallback((name, value) => {
    let error = "";
    if (name === "email") error = validateEmail(value);
    if (name === "password") error = validatePassword(value, false);
    setLoginErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  }, []);

  const handleLoginBlur = (e) => {
    const { name, value } = e.target;
    setLoginTouched((prev) => ({ ...prev, [name]: true }));
    setTimeout(() => {
      validateLoginField(name, value);
    }, 0); // within 100ms — synchronous but deferred to next tick
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    // Validate all fields
    const emailErr = validateEmail(loginFields.email);
    const passErr = validatePassword(loginFields.password, false);
    setLoginErrors({ email: emailErr, password: passErr });
    setLoginTouched({ email: true, password: true });
    if (emailErr || passErr) return;

    setLoading(true);
    try {
      const response = await apiClient.post("/auth/login", {
        email: loginFields.email,
        password: loginFields.password,
      });
      login(response.data);
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 401) {
        setApiError("Invalid email or password");
      } else {
        setApiError(err.response?.data?.detail || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Register handlers ---
  const handleRegChange = (e) => {
    const { name, value } = e.target;
    setRegFields((prev) => ({ ...prev, [name]: value }));
    if (regTouched[name]) {
      validateRegField(name, value);
    }
  };

  const validateRegField = useCallback((name, value) => {
    let error = "";
    if (name === "displayName") error = validateDisplayName(value);
    if (name === "email") error = validateEmail(value);
    if (name === "password") error = validatePassword(value, true);
    setRegErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  }, []);

  const handleRegBlur = (e) => {
    const { name, value } = e.target;
    setRegTouched((prev) => ({ ...prev, [name]: true }));
    setTimeout(() => {
      validateRegField(name, value);
    }, 0);
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const nameErr = validateDisplayName(regFields.displayName);
    const emailErr = validateEmail(regFields.email);
    const passErr = validatePassword(regFields.password, true);
    setRegErrors({ displayName: nameErr, email: emailErr, password: passErr });
    setRegTouched({ displayName: true, email: true, password: true });
    if (nameErr || emailErr || passErr) return;

    setLoading(true);
    try {
      const response = await apiClient.post("/auth/register", {
        email: regFields.email,
        password: regFields.password,
        display_name: regFields.displayName,
      });
      // Auto-login if tokens returned
      if (response.data?.access_token) {
        login(response.data);
        navigate("/dashboard");
      } else {
        setSuccessMessage("Registration successful! Please log in.");
        switchMode("login");
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setApiError("Email already registered");
      } else {
        setApiError(err.response?.data?.detail || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(mode === "login" ? styles.activeTab : {}) }}
            onClick={() => switchMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            style={{ ...styles.tab, ...(mode === "register" ? styles.activeTab : {}) }}
            onClick={() => switchMode("register")}
            type="button"
          >
            Register
          </button>
        </div>

        {successMessage && <p style={styles.successText}>{successMessage}</p>}
        {apiError && <p style={styles.apiError}>{apiError}</p>}

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} noValidate>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="login-email">Email</label>
              <input
                id="login-email"
                style={{ ...styles.input, ...(loginErrors.email && loginTouched.email ? styles.inputError : {}) }}
                type="email"
                name="email"
                value={loginFields.email}
                onChange={handleLoginChange}
                onBlur={handleLoginBlur}
                autoComplete="email"
              />
              {loginTouched.email && loginErrors.email && (
                <p style={styles.errorText}>{loginErrors.email}</p>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="login-password">Password</label>
              <input
                id="login-password"
                style={{ ...styles.input, ...(loginErrors.password && loginTouched.password ? styles.inputError : {}) }}
                type="password"
                name="password"
                value={loginFields.password}
                onChange={handleLoginChange}
                onBlur={handleLoginBlur}
                autoComplete="current-password"
              />
              {loginTouched.password && loginErrors.password && (
                <p style={styles.errorText}>{loginErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              style={{ ...styles.submitBtn, ...(loading ? styles.submitBtnDisabled : {}) }}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegSubmit} noValidate>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="reg-displayName">Display Name</label>
              <input
                id="reg-displayName"
                style={{ ...styles.input, ...(regErrors.displayName && regTouched.displayName ? styles.inputError : {}) }}
                type="text"
                name="displayName"
                value={regFields.displayName}
                onChange={handleRegChange}
                onBlur={handleRegBlur}
                autoComplete="name"
              />
              {regTouched.displayName && regErrors.displayName && (
                <p style={styles.errorText}>{regErrors.displayName}</p>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                style={{ ...styles.input, ...(regErrors.email && regTouched.email ? styles.inputError : {}) }}
                type="email"
                name="email"
                value={regFields.email}
                onChange={handleRegChange}
                onBlur={handleRegBlur}
                autoComplete="email"
              />
              {regTouched.email && regErrors.email && (
                <p style={styles.errorText}>{regErrors.email}</p>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                style={{ ...styles.input, ...(regErrors.password && regTouched.password ? styles.inputError : {}) }}
                type="password"
                name="password"
                value={regFields.password}
                onChange={handleRegChange}
                onBlur={handleRegBlur}
                autoComplete="new-password"
              />
              {regTouched.password && regErrors.password && (
                <p style={styles.errorText}>{regErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              style={{ ...styles.submitBtn, ...(loading ? styles.submitBtnDisabled : {}) }}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
