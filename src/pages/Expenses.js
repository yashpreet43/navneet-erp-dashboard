import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/common/PageHeader";
import FadeContent from "../components/animations/FadeContent";
import GlassCard from "../components/common/GlassCard";
import DataTable from "../components/common/DataTable";
import KPICard from "../components/common/KPICard";
import StatusBadge from "../components/common/StatusBadge";
import { FormSelect, FormButton } from "../components/common/FormComponents";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import theme from "../styles/theme";

// Helper to convert YYYY-MM to Month Name
function getMonthName(yearMonthStr) {
  if (!yearMonthStr) return "";
  const [year, month] = yearMonthStr.split("-");
  const date = new Date(year, parseInt(month) - 1, 1);
  return date.toLocaleString("default", { month: "short", year: "numeric" });
}

// Helper to get next month YYYY-MM
function getNextMonthKey(yearMonthStr) {
  if (!yearMonthStr) return "";
  const [y, m] = yearMonthStr.split("-").map(Number);
  let nextM = m + 1;
  let nextY = y;
  if (nextM > 12) {
    nextM = 1;
    nextY += 1;
  }
  return `${nextY}-${String(nextM).padStart(2, "0")}`;
}

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.small,
          padding: "10px",
          boxShadow: theme.shadows.glass
        }}
      >
        <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: theme.colors.textPrimary, marginBottom: "5px" }}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{ margin: 0, fontSize: "12.5px", color: "#60a5fa" }}
          >
            {entry.name}: ₹{entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

function Expenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState("log"); // "log" or "analytics"
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    setIsLoading(true);
    console.log("Fetching expenses from Supabase...");
    let { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        expense_documents (
          file_name,
          file_url
        )
      `)
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("Supabase fetch query failed:", error.message || error);
      const fallback = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      setIsLoading(false);
      if (fallback.error) {
        setFetchError(fallback.error.message);
      } else {
        setExpenses(fallback.data || []);
      }
    } else {
      setIsLoading(false);
      setExpenses(data || []);
    }
  }

  async function markPaid(id) {
    const { error } = await supabase
      .from("expenses")
      .update({ status: "Paid" })
      .eq("id", id);

    if (error) {
      alert("Error marking expense as paid: " + error.message);
    } else {
      fetchExpenses();
    }
  }

  // Analytics derivations
  const deriveAnalytics = () => {
    if (expenses.length === 0) return null;

    // Group expenses by calendar month (YYYY-MM)
    const monthlyGroups = {};
    expenses.forEach((item) => {
      if (!item.expense_date) return;
      const monthKey = item.expense_date.substring(0, 7); // "YYYY-MM"
      monthlyGroups[monthKey] = (monthlyGroups[monthKey] || 0) + Number(item.amount || 0);
    });

    const sortedMonths = Object.keys(monthlyGroups).sort(); // chronological
    const monthsCount = sortedMonths.length;

    // Highest expense month
    let highestMonthAmount = 0;
    let highestMonthKey = "";
    Object.keys(monthlyGroups).forEach((key) => {
      if (monthlyGroups[key] > highestMonthAmount) {
        highestMonthAmount = monthlyGroups[key];
        highestMonthKey = key;
      }
    });

    const totalAllTime = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const averageMonthly = monthsCount > 0 ? Math.round(totalAllTime / monthsCount) : 0;

    // Choose default month for breakdown
    let activeMonth = selectedMonth;
    if (!activeMonth && sortedMonths.length > 0) {
      const latestMonth = sortedMonths[sortedMonths.length - 1];
      const latestMonthEntries = expenses.filter(
        (e) => e.expense_date && e.expense_date.substring(0, 7) === latestMonth
      );
      if (latestMonthEntries.length < 3 && sortedMonths.length > 1) {
        activeMonth = sortedMonths[sortedMonths.length - 2];
      } else {
        activeMonth = latestMonth;
      }
    }

    // Category breakdown for selected month
    const categoryGroups = {};
    expenses
      .filter((e) => e.expense_date && e.expense_date.substring(0, 7) === activeMonth)
      .forEach((item) => {
        const cat = item.category || "Others";
        categoryGroups[cat] = (categoryGroups[cat] || 0) + Number(item.amount || 0);
      });

    const categoryBreakdownData = Object.keys(categoryGroups).map((cat) => ({
      name: cat,
      Amount: categoryGroups[cat]
    }));

    // Find highest expense category
    let highestCategoryAmount = 0;
    let highestCategoryName = "None";
    categoryBreakdownData.forEach((item) => {
      if (item.Amount > highestCategoryAmount) {
        highestCategoryAmount = item.Amount;
        highestCategoryName = item.name;
      }
    });

    // Month-over-Month changes & alerts
    const insights = [];
    if (monthsCount > 1) {
      const latestM = sortedMonths[monthsCount - 1];
      const prevM = sortedMonths[monthsCount - 2];
      const latestVal = monthlyGroups[latestM];
      const prevVal = monthlyGroups[prevM];

      const diff = latestVal - prevVal;
      const pct = prevVal > 0 ? (diff / prevVal) * 100 : 0;

      if (diff > 0) {
        insights.push({
          type: "increase",
          title: `${getMonthName(latestM)} Outflow Increased`,
          desc: `Monthly spending grew by ₹${diff.toLocaleString()} (+${pct.toFixed(1)}%) compared to ${getMonthName(prevM)}.`
        });
      } else if (diff < 0) {
        insights.push({
          type: "decrease",
          title: `${getMonthName(latestM)} Outflow Reduced`,
          desc: `Monthly spending decreased by ₹${Math.abs(diff).toLocaleString()} (${pct.toFixed(1)}%) compared to ${getMonthName(prevM)}.`
        });
      }
    }

    // Alert if any manual entry exceeds 50k
    const largeExpenses = expenses.filter((e) => Number(e.amount) > 50000);
    if (largeExpenses.length > 0) {
      insights.push({
        type: "danger",
        title: "High Value Outflows Detected",
        desc: `${largeExpenses.length} transaction(s) exceed ₹50,000. Review remarks to verify cost efficiency.`
      });
    }

    // 3-Month Linear Regression Forecast fallback
    let predictedNextMonth = 0;
    let predictedGrowth = 0;
    let nextMonthName = "";

    if (monthsCount >= 3) {
      const latestM = sortedMonths[monthsCount - 1];
      nextMonthName = getMonthName(getNextMonthKey(latestM));

      // Simple regression mapping months to index numbers
      const x = Array.from({ length: monthsCount }, (_, i) => i);
      const y = sortedMonths.map((m) => monthlyGroups[m]);

      const n = monthsCount;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, val, idx) => sum + val * y[idx], 0);
      const sumXX = x.reduce((sum, val) => sum + val * val, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      predictedNextMonth = Math.round(slope * n + intercept);
      if (predictedNextMonth < 0) predictedNextMonth = 0;

      const lastMonthVal = y[n - 1];
      predictedGrowth = lastMonthVal > 0 ? ((predictedNextMonth - lastMonthVal) / lastMonthVal) * 100 : 0;
    }

    const monthlyTrendData = sortedMonths.map((m) => ({
      name: getMonthName(m),
      Expenses: monthlyGroups[m]
    }));

    return {
      monthlyGroups,
      sortedMonths,
      monthsCount,
      highestMonthAmount,
      highestMonthLabel: getMonthName(highestMonthKey),
      averageMonthly,
      activeMonth,
      categoryBreakdownData,
      highestCategoryAmount,
      highestCategoryName,
      insights,
      predictedNextMonth,
      predictedGrowth,
      nextMonthName,
      monthlyTrendData
    };
  };

  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const analytics = deriveAnalytics();

  // Columns for DataTable
  const columns = [
    { header: "Date", key: "expense_date" },
    { header: "Category", key: "category" },
    {
      header: "Amount",
      render: (item) => <span style={{ fontWeight: 700 }}>₹{Number(item.amount || 0).toLocaleString()}</span>
    },
    {
      header: "Entry Type",
      render: (item) => <span style={{ textTransform: "capitalize" }}>{item.entry_type || "manual"}</span>
    },
    {
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />
    },
    {
      header: "Action",
      render: (item) => (
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {item.status === "Pending" && (
            <FormButton
              variant="success"
              style={{ padding: "6px 12px", fontSize: "12.5px" }}
              onClick={() => markPaid(item.id)}
            >
              Mark Paid
            </FormButton>
          )}
          {item.expense_documents && item.expense_documents.length > 0 && (
            <FormButton
              variant="secondary"
              style={{ padding: "6px 12.5px", fontSize: "12.5px" }}
              onClick={() => window.open(item.expense_documents[0].file_url, "_blank")}
            >
              📎 View Bill
            </FormButton>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <FadeContent blur={true} duration={800} initialOpacity={0}>
          <PageHeader
            title="Expenses"
            subtitle="Monitor operational expenses, billing history, and forecast outflows."
            actions={
              <FormButton variant="primary" onClick={() => navigate("/add-expense")}>
                Add Expense
              </FormButton>
            }
          />

          <style>{`
            .expense-tabs-container {
              display: flex;
              gap: 10px;
              margin-bottom: 25px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08);
              padding-bottom: 10px;
            }
            .expense-tab-btn {
              padding: 12px 24px;
              border-radius: 12px;
              background: transparent;
              border: none;
              color: #94a3b8;
              font-weight: 600;
              font-size: 14.5px;
              cursor: pointer;
              position: relative;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .expense-tab-btn:hover {
              color: rgba(255, 255, 255, 0.95);
            }
            .expense-tab-btn.active {
              color: #ffffff;
            }
          `}</style>

          <div className="expense-tabs-container">
            <button
              className={`expense-tab-btn ${activeTab === "log" ? "active" : ""}`}
              onClick={() => setActiveTab("log")}
            >
              {activeTab === "log" && (
                <motion.div
                  layoutId="activeExpenseTab"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    borderRadius: "12px",
                    zIndex: 0
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              <span style={{ position: "relative", zIndex: 1 }}>📋 Expenses Log</span>
            </button>
            <button
              className={`expense-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              {activeTab === "analytics" && (
                <motion.div
                  layoutId="activeExpenseTab"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    borderRadius: "12px",
                    zIndex: 0
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              <span style={{ position: "relative", zIndex: 1 }}>📈 Forecasting & Anomalies</span>
            </button>
          </div>

          {activeTab === "log" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <KPICard title="Total Expenses" value={`₹${totalExpense.toLocaleString()}`} statusColor="#3b82f6" loading={isLoading} />
                <KPICard title="Total Entries" value={expenses.length} statusColor="#8b5cf6" loading={isLoading} />
              </div>

              <GlassCard title="Logged Transactions" subtitle="Complete history of manual and automated expense logs.">
                <DataTable
                  columns={columns}
                  data={expenses}
                  isLoading={isLoading}
                  emptyMessage="No expense records available."
                />
              </GlassCard>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              {analytics && (
                <>
                  {/* Metrics Summary Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
                    <KPICard title="Average Monthly Expense" value={`₹${analytics.averageMonthly.toLocaleString()}`} statusColor="#10b981" />
                    <KPICard title={`Highest Month (${analytics.highestMonthLabel})`} value={`₹${analytics.highestMonthAmount.toLocaleString()}`} statusColor="#f59e0b" />
                    <KPICard title="Largest Cost Category" value={analytics.highestCategoryName} subtitle={`₹${analytics.highestCategoryAmount.toLocaleString()}`} statusColor="#ef4444" />
                  </div>

                  {/* MoM Change Alerts & Factory Owner Insights */}
                  <GlassCard title="Factory Owner Insights" subtitle="Smart cost anomaly and month-over-month alerts.">
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {analytics.insights.map((insight, idx) => {
                        let color = "#cbd5e1";
                        let border = "rgba(255, 255, 255, 0.08)";
                        let bg = "rgba(255, 255, 255, 0.03)";
                        let icon = "💡";

                        if (insight.type === "increase") {
                          color = "#fecaca";
                          border = "rgba(239, 68, 68, 0.15)";
                          bg = "rgba(239, 68, 68, 0.05)";
                          icon = "📈";
                        } else if (insight.type === "decrease") {
                          color = "#d1fae5";
                          border = "rgba(16, 185, 129, 0.15)";
                          bg = "rgba(16, 185, 129, 0.05)";
                          icon = "📉";
                        } else if (insight.type === "danger") {
                          color = "#fca5a5";
                          border = "rgba(239, 68, 68, 0.25)";
                          bg = "rgba(239, 68, 68, 0.08)";
                          icon = "⚠️";
                        }

                        return (
                          <div
                            key={idx}
                            style={{
                              background: bg,
                              border: `1px solid ${border}`,
                              borderRadius: "12px",
                              padding: "16px 20px",
                              display: "flex",
                              alignItems: "start",
                              gap: "15px",
                              backdropFilter: "blur(8px)",
                              textAlign: "left"
                            }}
                          >
                            <span style={{ fontSize: "20px" }}>{icon}</span>
                            <div>
                              <strong style={{ display: "block", marginBottom: "4px", color: color, fontSize: "15px" }}>
                                {insight.title}
                              </strong>
                              <span style={{ fontSize: "13.5px", color: "#9ca3af", lineHeight: "1.5" }}>
                                {insight.desc}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {analytics.insights.length === 0 && (
                        <p style={{ fontStyle: "italic", color: "#64748b", margin: 0 }}>No active cost alerts or abnormalities detected.</p>
                      )}
                    </div>
                  </GlassCard>

                  {/* Dynamic predictions box */}
                  <GlassCard title="Outflow Predictions" subtitle="Forecasts based on monthly expense linear trends.">
                    {analytics.monthsCount < 3 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#cbd5e1" }}>
                        <span style={{ fontSize: "20px" }}>ℹ️</span>
                        <span style={{ fontSize: "14px" }}>
                          More historical expense data is required for predictions. Future spending trends will unlock once 3 months of history are logged.
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          background: "rgba(59, 130, 246, 0.06)",
                          border: "1px solid rgba(59, 130, 246, 0.15)",
                          borderRadius: "12px",
                          padding: "20px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "15px",
                          textAlign: "left"
                        }}
                      >
                        <div>
                          <strong style={{ display: "block", color: "#60a5fa", fontSize: "15px", marginBottom: "4px" }}>
                            Expected Next Month Outflow ({analytics.nextMonthName})
                          </strong>
                          <span style={{ fontSize: "13px", color: "#cbd5e1" }}>
                            Based on average monthly trends, next month's spending is projected to be around 
                            <strong style={{ color: "#ffffff", marginLeft: "4px" }}>₹{analytics.predictedNextMonth.toLocaleString()}</strong>.
                          </span>
                        </div>
                        <div style={{
                          background: analytics.predictedGrowth > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: analytics.predictedGrowth > 0 ? "#f87171" : "#4ade80",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          fontSize: "14px"
                        }}>
                          {analytics.predictedGrowth > 0 ? "▲" : "▼"} {Math.abs(analytics.predictedGrowth).toFixed(1)}% Projected Change
                        </div>
                      </div>
                    )}
                  </GlassCard>

                  {/* Simple Visualisations Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "25px" }}>
                    {/* Chart 1: Total Monthly spend */}
                    <GlassCard title="Total Monthly Outflow" subtitle="Actual historic spend by month.">
                      <div style={{ height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.monthlyTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(val) => `₹${val.toLocaleString()}`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="Expenses" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>

                    {/* Chart 2: Category breakdown */}
                    <GlassCard
                      title="Breakdown by Category"
                      headerActions={
                        analytics.sortedMonths && analytics.sortedMonths.length > 0 && (
                          <FormSelect
                            value={analytics.activeMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ marginBottom: 0, padding: "6px 12px", fontSize: "12px", width: "160px" }}
                          >
                            {analytics.sortedMonths.map(m => (
                              <option key={m} value={m}>
                                {getMonthName(m)}
                              </option>
                            ))}
                          </FormSelect>
                        )
                      }
                      subtitle={analytics.activeMonth ? `Showing ${getMonthName(analytics.activeMonth)} expenses` : ""}
                    >
                      <div style={{ height: "300px" }}>
                        {analytics.categoryBreakdownData.length === 0 ? (
                          <div style={{ textAlign: "center", paddingTop: "80px", color: theme.colors.textMuted, fontStyle: "italic" }}>
                            No category breakdown available for the selected month.
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.categoryBreakdownData} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                              <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(val) => `₹${val.toLocaleString()}`} />
                              <YAxis dataKey="name" type="category" tick={{ fill: "#9ca3af", fontSize: 11 }} width={90} />
                              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Payout"]} content={<CustomTooltip />} />
                              <Bar dataKey="Amount" radius={[0, 4, 4, 0]}>
                                {analytics.categoryBreakdownData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </GlassCard>
                  </div>
                </>
              )}
            </div>
          )}
        </FadeContent>
      </div>
    </div>
  );
}

export default Expenses;