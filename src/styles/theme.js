const theme = {
  colors: {
    background: "linear-gradient(135deg, #020617, #0f172a, #172554)",
    card: "rgba(255, 255, 255, 0.03)",
    border: "rgba(255, 255, 255, 0.08)",
    primary: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
    secondary: "rgba(255, 255, 255, 0.08)",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    textPrimary: "#f8fafc",
    textSecondary: "#cbd5e1",
    textMuted: "#64748b"
  },
  radius: {
    small: "8px",
    medium: "12px",
    large: "20px",
    extraLarge: "28px"
  },
  spacing: {
    small: "8px",
    medium: "16px",
    large: "24px",
    extraLarge: "32px"
  },
  shadows: {
    glass: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
    glow: "0 0 15px rgba(59, 130, 246, 0.15)",
    hover: "0 12px 40px rgba(99, 102, 241, 0.15), 0 8px 32px rgba(0, 0, 0, 0.25)"
  },
  transitions: {
    default: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    hover: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.3s, box-shadow 0.3s"
  }
};

export default theme;
