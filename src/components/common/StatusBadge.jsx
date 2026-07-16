import React from "react";

export default function StatusBadge({ status }) {
  const normalized = (status || "").toLowerCase().trim();

  let badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "capitalize",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
    width: "fit-content"
  };

  if (normalized === "paid" || normalized === "completed" || normalized === "active") {
    badgeStyle.background = "rgba(16, 185, 129, 0.15)";
    badgeStyle.border = "1px solid rgba(16, 185, 129, 0.3)";
    badgeStyle.color = "#34d399";
  } else if (normalized === "pending" || normalized === "medium" || normalized === "medium priority") {
    badgeStyle.background = "rgba(245, 158, 11, 0.15)";
    badgeStyle.border = "1px solid rgba(245, 158, 11, 0.3)";
    badgeStyle.color = "#fbbf24";
  } else if (normalized === "inactive" || normalized === "high" || normalized === "high priority" || normalized === "danger") {
    badgeStyle.background = "rgba(239, 68, 68, 0.15)";
    badgeStyle.border = "1px solid rgba(239, 68, 68, 0.3)";
    badgeStyle.color = "#f87171";
  } else {
    // Low, others
    badgeStyle.background = "rgba(59, 130, 246, 0.15)";
    badgeStyle.border = "1px solid rgba(59, 130, 246, 0.3)";
    badgeStyle.color = "#60a5fa";
  }

  return (
    <span style={badgeStyle} className={`status-badge status-${normalized}`}>
      {status}
    </span>
  );
}
