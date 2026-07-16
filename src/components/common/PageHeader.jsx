import React from "react";
import theme from "../../styles/theme";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.large,
        borderBottom: `1px solid ${theme.colors.border}`,
        paddingBottom: theme.spacing.medium,
        width: "100%"
      }}
      className="page-header"
    >
      <div style={{ textAlign: "left" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: theme.colors.textPrimary, letterSpacing: "-0.02em" }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: "6px 0 0 0", fontSize: "14.5px", color: theme.colors.textSecondary }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>{actions}</div>}
    </div>
  );
}
