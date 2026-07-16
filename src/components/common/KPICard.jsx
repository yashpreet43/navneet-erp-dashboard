import React from "react";
import theme from "../../styles/theme";
import GlassCard from "./GlassCard";

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  statusColor,
  loading = false
}) {
  return (
    <GlassCard style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "16px 20px", minHeight: "130px" }}>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="skeleton-loader" style={{ height: "12px", width: "50%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
          <div className="skeleton-loader" style={{ height: "24px", width: "75%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
          <div className="skeleton-loader" style={{ height: "10px", width: "40%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.spacing.small }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>
              {title}
            </span>
            {icon && <span style={{ color: statusColor || "#3b82f6", opacity: 0.8, display: "flex", alignItems: "center" }}>{icon}</span>}
          </div>
          
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "4px 0", textAlign: "left" }}>
            <span style={{ fontSize: "26px", fontWeight: 800, color: theme.colors.textPrimary, letterSpacing: "-0.02em" }}>
              {value}
            </span>
            {trend && (
              <span style={{
                fontSize: "12px",
                fontWeight: 600,
                color: trend.type === "positive" ? "#34d399" : "#f87171"
              }}>
                {trend.type === "positive" ? "▲" : "▼"} {trend.value}
              </span>
            )}
          </div>
          
          {subtitle && (
            <span style={{ fontSize: "12px", color: theme.colors.textMuted, textAlign: "left", marginTop: "4px" }}>
              {subtitle}
            </span>
          )}
        </>
      )}
    </GlassCard>
  );
}
