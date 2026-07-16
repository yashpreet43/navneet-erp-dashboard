import React from "react";
import theme from "../../styles/theme";

const baseInputStyle = {
  width: "100%",
  padding: "12px 16px",
  background: "rgba(15, 23, 42, 0.4)",
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.small,
  color: theme.colors.textPrimary,
  fontSize: "14px",
  transition: theme.transitions.default,
  outline: "none",
  boxSizing: "border-box"
};

export function FormInput({ label, error, style = {}, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", marginBottom: "15px" }}>
      {label && <label style={{ fontSize: "13.5px", fontWeight: 600, color: theme.colors.textSecondary, textAlign: "left" }}>{label}</label>}
      <input
        style={{ ...baseInputStyle, ...style }}
        className="form-input-focus"
        {...props}
      />
      {error && <span style={{ fontSize: "12px", color: theme.colors.danger, textAlign: "left" }}>{error}</span>}
    </div>
  );
}

export function FormSelect({ label, error, children, style = {}, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", marginBottom: "15px" }}>
      {label && <label style={{ fontSize: "13.5px", fontWeight: 600, color: theme.colors.textSecondary, textAlign: "left" }}>{label}</label>}
      <select
        style={{ ...baseInputStyle, ...style }}
        className="form-input-focus"
        {...props}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: "12px", color: theme.colors.danger, textAlign: "left" }}>{error}</span>}
    </div>
  );
}

export function FormTextarea({ label, error, style = {}, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", marginBottom: "15px" }}>
      {label && <label style={{ fontSize: "13.5px", fontWeight: 600, color: theme.colors.textSecondary, textAlign: "left" }}>{label}</label>}
      <textarea
        style={{ ...baseInputStyle, resize: "vertical", minHeight: "80px", ...style }}
        className="form-input-focus"
        {...props}
      />
      {error && <span style={{ fontSize: "12px", color: theme.colors.danger, textAlign: "left" }}>{error}</span>}
    </div>
  );
}

export function FormDatePicker({ label, error, style = {}, ...props }) {
  return (
    <FormInput
      label={label}
      error={error}
      type="date"
      style={style}
      {...props}
    />
  );
}

export function FormButton({ children, variant = "primary", disabled = false, style = {}, ...props }) {
  let buttonStyle = {
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: 600,
    borderRadius: theme.radius.small,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    color: "#ffffff",
    transition: theme.transitions.default,
    outline: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  };

  if (variant === "primary") {
    buttonStyle.background = theme.colors.primary;
  } else if (variant === "secondary") {
    buttonStyle.background = theme.colors.secondary;
    buttonStyle.border = `1px solid ${theme.colors.border}`;
    buttonStyle.color = theme.colors.textPrimary;
  } else if (variant === "danger") {
    buttonStyle.background = "rgba(239, 68, 68, 0.2)";
    buttonStyle.border = "1px solid rgba(239, 68, 68, 0.4)";
    buttonStyle.color = "#f87171";
  } else if (variant === "success") {
    buttonStyle.background = "rgba(16, 185, 129, 0.2)";
    buttonStyle.border = "1px solid rgba(16, 185, 129, 0.4)";
    buttonStyle.color = "#34d399";
  }

  return (
    <button
      style={{ ...buttonStyle, ...style }}
      className={`form-btn-${variant}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
