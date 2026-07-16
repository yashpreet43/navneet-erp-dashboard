import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import theme from "../../styles/theme";

export default function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "500px"
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(11, 16, 32, 0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
            boxSizing: "border-box"
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.large,
              boxShadow: theme.shadows.glass,
              padding: theme.spacing.large,
              maxWidth: maxWidth,
              width: "100%",
              color: theme.colors.textPrimary,
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
              boxSizing: "border-box"
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.spacing.large,
              borderBottom: `1px solid ${theme.colors.border}`,
              paddingBottom: theme.spacing.medium
            }}>
              {title && <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>{title}</h2>}
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: theme.colors.textSecondary,
                  cursor: "pointer",
                  fontSize: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  padding: "4px",
                  borderRadius: "50%",
                  transition: theme.transitions.default
                }}
                className="modal-close-btn"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="modal-content" style={{ textAlign: "left" }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
