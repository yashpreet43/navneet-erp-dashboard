import React from "react";
import { motion } from "framer-motion";
import theme from "../../styles/theme";

export default function GlassCard({
  children,
  title,
  subtitle,
  icon,
  headerActions,
  className = "",
  style = {},
  onClick,
  ...motionProps
}) {
  return (
    <motion.section
      className={`glass-card ${className}`}
      onClick={onClick}
      style={{
        background: theme.colors.card,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.large,
        boxShadow: theme.shadows.glass,
        padding: theme.spacing.large,
        transition: theme.transitions.hover,
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
      whileHover={onClick ? { y: -4, borderColor: "rgba(99, 102, 241, 0.4)" } : undefined}
      {...motionProps}
    >
      {(title || icon || headerActions) && (
        <div className="dashboard-card-header" style={{ marginBottom: theme.spacing.medium }}>
          <div className="dashboard-card-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {icon && <span style={{ color: "#3b82f6", display: "flex", alignItems: "center" }}>{icon}</span>}
            <div>
              {title && <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: theme.colors.textPrimary }}>{title}</h2>}
              {subtitle && <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: theme.colors.textSecondary }}>{subtitle}</p>}
            </div>
          </div>
          {headerActions && <div className="card-actions">{headerActions}</div>}
        </div>
      )}
      {children}
    </motion.section>
  );
}
