import React from "react";
import theme from "../../styles/theme";

export default function DataTable({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No records found.",
  loadingRows = 5,
  pagination
}) {
  return (
    <div className="table-container" style={{
      overflowX: "auto",
      width: "100%",
      borderRadius: theme.radius.medium,
      border: `1px solid ${theme.colors.border}`,
      background: "rgba(15, 23, 42, 0.3)",
      backdropFilter: "blur(10px)"
    }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left"
      }}>
        <thead>
          <tr style={{
            borderBottom: `1px solid ${theme.colors.border}`,
            background: "rgba(255, 255, 255, 0.02)"
          }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: "16px 20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: theme.colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  position: "sticky",
                  top: 0,
                  zIndex: 10
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: loadingRows }).map((_, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                {columns.map((_, cIdx) => (
                  <td key={cIdx} style={{ padding: "16px 20px" }}>
                    <div
                      className="skeleton-loader"
                      style={{
                        height: "16px",
                        width: "80%",
                        background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s infinite",
                        borderRadius: "4px"
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: theme.colors.textMuted,
                  fontSize: "14px",
                  fontStyle: "italic"
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rIdx) => (
              <tr
                key={rIdx}
                className="table-row-hover"
                style={{
                  borderBottom: `1px solid ${theme.colors.border}`,
                  background: rIdx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.01)",
                  transition: theme.transitions.default
                }}
              >
                {columns.map((col, cIdx) => (
                  <td
                    key={cIdx}
                    style={{
                      padding: "16px 20px",
                      fontSize: "14px",
                      color: theme.colors.textPrimary
                    }}
                  >
                    {col.render ? col.render(item, rIdx) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          borderTop: `1px solid ${theme.colors.border}`,
          background: "rgba(255, 255, 255, 0.01)"
        }}>
          <span style={{ fontSize: "13px", color: theme.colors.textSecondary }}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className="dashboard-btn-secondary"
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                borderRadius: "6px",
                cursor: pagination.currentPage === 1 ? "not-allowed" : "pointer",
                opacity: pagination.currentPage === 1 ? 0.5 : 1
              }}
            >
              Previous
            </button>
            <button
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className="dashboard-btn-secondary"
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                borderRadius: "6px",
                cursor: pagination.currentPage === pagination.totalPages ? "not-allowed" : "pointer",
                opacity: pagination.currentPage === pagination.totalPages ? 0.5 : 1
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
