import React, { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Others"];

const initialForm = { amount: "", category: "", date: "", description: "" };
const initialErrors = { amount: "", category: "", date: "", description: "" };

export default function ExpenseFormModal({ isOpen, onClose, onSuccess, expense }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setForm({
          amount: expense.amount != null ? String(expense.amount) : "",
          category: expense.category || "",
          date: expense.date || "",
          description: expense.description || "",
        });
      } else {
        setForm(initialForm);
      }
      setErrors(initialErrors);
      setApiError("");
    }
  }, [isOpen, expense]);

  if (!isOpen) return null;

  function validateField(name, value) {
    switch (name) {
      case "amount": {
        if (!value && value !== 0) return "Amount is required.";
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) return "Amount must be greater than 0.";
        return "";
      }
      case "category":
        return value ? "" : "Category is required.";
      case "date":
        return value ? "" : "Date is required.";
      case "description":
        return value.length > 255 ? "Description must be 255 characters or fewer." : "";
      default:
        return "";
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error on change if field was already touched
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  }

  function validateAll() {
    const newErrors = {
      amount: validateField("amount", form.amount),
      category: validateField("category", form.category),
      date: validateField("date", form.date),
      description: validateField("description", form.description),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => !e);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateAll()) return;

    setSubmitting(true);
    setApiError("");

    const payload = {
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
      description: form.description,
    };

    try {
      if (expense) {
        await apiClient.put(`/expenses/${expense.id}`, payload);
      } else {
        await apiClient.post("/expenses", payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.detail || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const isEdit = Boolean(expense);

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: "28px 32px",
          width: "100%",
          maxWidth: 460,
          position: "relative",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 22,
            cursor: "pointer",
            color: "#6b7280",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <h3 style={{ margin: "0 0 20px", fontSize: 18, color: "#111827" }}>
          {isEdit ? "Edit Expense" : "Add Expense"}
        </h3>

        {apiError && (
          <div
            style={{
              color: "#dc2626",
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 4,
              padding: "8px 12px",
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Amount */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Amount (₹) <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              onBlur={handleBlur}
              min="0.01"
              step="0.01"
              placeholder="0.00"
              style={inputStyle(errors.amount)}
            />
            {errors.amount && <p style={errorStyle}>{errors.amount}</p>}
          </div>

          {/* Category */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Category <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              onBlur={handleBlur}
              style={inputStyle(errors.category)}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p style={errorStyle}>{errors.category}</p>}
          </div>

          {/* Date */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Date <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              onBlur={handleBlur}
              style={inputStyle(errors.date)}
            />
            {errors.date && <p style={errorStyle}>{errors.date}</p>}
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>
              Description{" "}
              <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={255}
              rows={3}
              placeholder="Add a note..."
              style={{ ...inputStyle(errors.description), resize: "vertical", minHeight: 72 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {errors.description
                ? <p style={{ ...errorStyle, margin: 0 }}>{errors.description}</p>
                : <span />}
              <span style={{ fontSize: 12, color: form.description.length > 240 ? "#dc2626" : "#9ca3af" }}>
                {form.description.length}/255
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 18px",
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                color: "#374151",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "8px 18px",
                background: submitting ? "#a5b4fc" : "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
  marginBottom: 4,
};

function inputStyle(hasError) {
  return {
    width: "100%",
    padding: "8px 10px",
    border: `1px solid ${hasError ? "#f87171" : "#d1d5db"}`,
    borderRadius: 6,
    fontSize: 14,
    color: "#111827",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
  };
}

const errorStyle = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "#dc2626",
};
