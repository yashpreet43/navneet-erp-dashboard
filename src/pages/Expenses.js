import { useEffect, useState } from "react";
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
import { motion } from "framer-motion";

import Sidebar from "../components/Sidebar";
import { supabase } from "../supabaseClient";

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
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "8px",
          padding: "10px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)"
        }}
      >
        <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "#f8fafc", marginBottom: "5px" }}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{ margin: 0, fontSize: "12px", color: "#60a5fa" }}
          >
            {entry.name}: ₹{entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Premium colors for the Category Breakdown chart
const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState("log"); // "log" or "analytics"
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
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
      console.error("Supabase fetch query with join failed:", error.message || error);
      console.log("Attempting fallback select * query...");
      const fallback = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (fallback.error) {
        console.error("Supabase fallback fetch query failed:", fallback.error.message || fallback.error);
        setFetchError("Failed to retrieve expenses: " + fallback.error.message);
        return;
      }
      data = fallback.data;
      error = null;
    }

    console.log("Successfully fetched expenses data:", data);
    setExpenses(data || []);
    setFetchError(null);

    // Default matching logic: if latest month has < 3 entries and previous exists, default to previous
    if (data && data.length > 0) {
      const monthCounts = {};
      data.forEach(exp => {
        if (!exp.expense_date) return;
        const month = exp.expense_date.substring(0, 7);
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });
      const sorted = Object.keys(monthCounts).sort();
      if (sorted.length > 0) {
        const latest = sorted[sorted.length - 1];
        if (monthCounts[latest] < 3 && sorted.length >= 2) {
          setSelectedMonth(sorted[sorted.length - 2]);
        } else {
          setSelectedMonth(latest);
        }
      }
    }
  }

  async function markPaid(id) {
    const { error } = await supabase
      .from("expenses")
      .update({
        status: "Paid",
        paid_date: new Date().toISOString().split("T")[0]
      })
      .eq("id", id);

    if (!error) {
      fetchExpenses();
    }
  }

  const totalExpense = expenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  // Business-friendly Analytics and Insights
  const generateBusinessAnalytics = () => {
    if (expenses.length === 0) {
      return {
        monthsCount: 0,
        monthlyTrendData: [],
        categoryBreakdownData: [],
        insights: [],
        averageMonthly: 0,
        highestMonthLabel: "N/A",
        highestMonthAmount: 0,
        highestCategoryName: "N/A",
        highestCategoryAmount: 0,
        predictedNextMonth: 0,
        predictedGrowth: 0,
        nextMonthName: ""
      };
    }

    // 1. Group expenses by month and category
    const monthGroups = {}; // key: "YYYY-MM", value: { total: X, categories: { [cat]: Y } }
    const categoryTotals = {}; // key: [cat], value: total amount overall

    expenses.forEach(exp => {
      const dateStr = exp.expense_date;
      if (!dateStr) return;
      const month = dateStr.substring(0, 7);
      const amount = Number(exp.amount || 0);
      const category = exp.category || "Other";

      // Group monthly
      if (!monthGroups[month]) {
        monthGroups[month] = { total: 0, categories: {} };
      }
      monthGroups[month].total += amount;
      if (!monthGroups[month].categories[category]) {
        monthGroups[month].categories[category] = 0;
      }
      monthGroups[month].categories[category] += amount;

      // Group category overall
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    const sortedMonths = Object.keys(monthGroups).sort();
    const monthsCount = sortedMonths.length;
    const latestMonthKey = sortedMonths[sortedMonths.length - 1];
    
    const latestMonthData = monthGroups[latestMonthKey] || { total: 0, categories: {} };
    
    // Fall back to latest month if selectedMonth is not in list
    const activeMonth = sortedMonths.includes(selectedMonth) ? selectedMonth : latestMonthKey;
    const activeMonthData = monthGroups[activeMonth] || { total: 0, categories: {} };

    // 2. Average monthly expense
    const totalAllAmount = Object.values(monthGroups).reduce((sum, item) => sum + item.total, 0);
    const averageMonthly = Math.round(totalAllAmount / (monthsCount || 1));

    // 3. Highest Expense Month
    let highestMonthKey = "N/A";
    let highestMonthAmount = 0;
    Object.keys(monthGroups).forEach(m => {
      if (monthGroups[m].total > highestMonthAmount) {
        highestMonthAmount = monthGroups[m].total;
        highestMonthKey = m;
      }
    });
    const highestMonthLabel = highestMonthKey !== "N/A" ? getMonthName(highestMonthKey) : "N/A";

    // 4. Highest Expense Category (for the active selected month)
    let highestCategoryName = "N/A";
    let highestCategoryAmount = 0;
    Object.keys(activeMonthData.categories).forEach(cat => {
      if (activeMonthData.categories[cat] > highestCategoryAmount) {
        highestCategoryAmount = activeMonthData.categories[cat];
        highestCategoryName = cat;
      }
    });

    // 5. Chart Data: Monthly totals
    const monthlyTrendData = sortedMonths.map(m => ({
      name: getMonthName(m),
      Expenses: monthGroups[m].total
    }));

    // 6. Chart Data: Category breakdown for the active selected month
    const categoryBreakdownData = Object.keys(activeMonthData.categories).map(cat => ({
      name: cat,
      Amount: activeMonthData.categories[cat]
    })).sort((a, b) => b.Amount - a.Amount);

    // 7. Month-over-Month calculations and predictions (if n >= 3)
    let predictedNextMonth = 0;
    let predictedGrowth = 0;
    let nextMonthName = "";

    if (monthsCount >= 3) {
      const x = Array.from({ length: monthsCount }, (_, i) => i);
      const y = sortedMonths.map(m => monthGroups[m].total);

      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < monthsCount; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumXX += x[i] * x[i];
      }

      const denominator = monthsCount * sumXX - sumX * sumX;
      let slope = 0;
      let intercept = sumY / monthsCount;
      if (denominator !== 0) {
        slope = (monthsCount * sumXY - sumX * sumY) / denominator;
        intercept = (sumY - slope * sumX) / monthsCount;
      }

      predictedNextMonth = Math.max(0, slope * monthsCount + intercept);
      const currentMonthAmount = latestMonthData.total;
      if (currentMonthAmount > 0) {
        predictedGrowth = ((predictedNextMonth - currentMonthAmount) / currentMonthAmount) * 100;
      }
      nextMonthName = getMonthName(getNextMonthKey(latestMonthKey));
    }

    // 8. Generate Business Insights list
    const insights = [];

    // MoM change insight
    if (monthsCount >= 2) {
      const prevMonthKey = sortedMonths[sortedMonths.length - 2];
      const prevTotal = monthGroups[prevMonthKey].total;
      const latestTotal = latestMonthData.total;
      const diff = latestTotal - prevTotal;
      const pct = Math.round((Math.abs(diff) / (prevTotal || 1)) * 100);

      if (diff > 0) {
        insights.push({
          type: "increase",
          title: `Expenses increased by ₹${diff.toLocaleString()} this month`,
          desc: `Total payouts rose by ${pct}% compared to ${getMonthName(prevMonthKey)}. Check details in the breakdown chart below.`
        });
      } else if (diff < 0) {
        insights.push({
          type: "decrease",
          title: `Expenses decreased by ₹${Math.abs(diff).toLocaleString()} this month`,
          desc: `Great job! Outflows dropped by ${pct}% compared to ${getMonthName(prevMonthKey)}.`
        });
      } else {
        insights.push({
          type: "neutral",
          title: "Monthly spend remained flat",
          desc: `Total expenses match exactly with ${getMonthName(prevMonthKey)} at ₹${latestTotal.toLocaleString()}.`
        });
      }

      // Utility stability insight (Electricity)
      const prevElec = monthGroups[prevMonthKey].categories["Electricity"] || 0;
      const currElec = latestMonthData.categories["Electricity"] || 0;
      if (prevElec > 0 && currElec > 0) {
        const elecChange = ((currElec - prevElec) / prevElec) * 100;
        if (Math.abs(elecChange) <= 5) {
          insights.push({
            type: "neutral",
            title: "Electricity costs remained stable",
            desc: `Power bill changed by only ${elecChange.toFixed(1)}% (₹${currElec.toLocaleString()} this month vs ₹${prevElec.toLocaleString()} last month).`
          });
        } else if (elecChange > 5) {
          insights.push({
            type: "warning",
            title: `Electricity costs increased by ${elecChange.toFixed(0)}%`,
            desc: `Power bill rose to ₹${currElec.toLocaleString()} (was ₹${prevElec.toLocaleString()}). Look for peak load issues or machine inefficiencies.`
          });
        }
      }
    } else {
      insights.push({
        type: "neutral",
        title: "Initial logging month recorded",
        desc: "Once you have logged expenses for a second month, this dashboard will automatically display month-over-month changes."
      });
    }

    // Largest category insight
    if (highestCategoryName !== "N/A" && latestMonthData.total > 0) {
      const share = Math.round((highestCategoryAmount / latestMonthData.total) * 100);
      insights.push({
        type: "info",
        title: `${highestCategoryName} remains the largest expense category`,
        desc: `It accounts for ₹${highestCategoryAmount.toLocaleString()} (${share}% of your total payouts of ₹${latestMonthData.total.toLocaleString()} in ${getMonthName(latestMonthKey)}).`
      });
    }

    // Labour costs summary
    const currLabour = latestMonthData.categories["Labour"] || 0;
    if (currLabour > 0) {
      insights.push({
        type: "info",
        title: `Labour payouts total ₹${currLabour.toLocaleString()}`,
        desc: `Factory labour wages and contract payouts represent a significant portion of this month's cash flow.`
      });
    }

    // Anomaly detection (Simplified for factory owners)
    if (monthsCount >= 3) {
      Object.keys(latestMonthData.categories).forEach(cat => {
        const catHistory = sortedMonths.map(m => monthGroups[m].categories[cat] || 0);
        const mean = catHistory.reduce((s, v) => s + v, 0) / monthsCount;
        const variance = catHistory.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / monthsCount;
        const std = Math.sqrt(variance);

        const currentVal = latestMonthData.categories[cat] || 0;
        const z = std > 0 ? (currentVal - mean) / std : 0;

        if (z > 2) {
          insights.push({
            type: "danger",
            title: `Abnormal spike in ${cat} expenses detected!`,
            desc: `This month's payout of ₹${currentVal.toLocaleString()} is significantly higher than your typical monthly average of ₹${Math.round(mean).toLocaleString()}. Please audit receipts.`
          });
        }
      });
    }

    return {
      monthsCount,
      monthlyTrendData,
      categoryBreakdownData,
      insights,
      averageMonthly,
      highestMonthLabel,
      highestMonthAmount,
      highestCategoryName,
      highestCategoryAmount,
      predictedNextMonth: Math.round(predictedNextMonth),
      predictedGrowth,
      nextMonthName,
      activeMonth,
      sortedMonths
    };
  };

  const analytics = generateBusinessAnalytics();

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <h1>Expense Management</h1>

        {/* Tab Toggle Navigation */}
        <style>{`
          .expense-tabs-container {
            display: flex;
            gap: 8px;
            margin-bottom: 30px;
            background: rgba(255, 255, 255, 0.03);
            padding: 6px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            width: fit-content;
            position: relative;
            backdrop-filter: blur(12px);
          }
          .expense-tab-btn {
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.55);
            border: none;
            background: transparent;
            border-radius: 12px;
            cursor: pointer;
            position: relative;
            outline: none;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            transform: translateY(0);
          }
          .expense-tab-btn:hover {
            color: rgba(255, 255, 255, 0.95);
            background: rgba(255, 255, 255, 0.04);
            transform: translateY(-1px);
          }
          .expense-tab-btn.active {
            color: #ffffff;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
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
          <>
            {fetchError ? (
              <div className="stat-card" style={{ padding: "40px", textAlign: "center", border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.05)" }}>
                <h3 style={{ color: "#f87171" }}>Error Loading Expenses</h3>
                <p style={{ color: "#fca5a5", marginBottom: "15px" }}>{fetchError}</p>
                <button className="dashboard-btn" onClick={fetchExpenses} style={{ margin: "0 auto" }}>Retry Fetch</button>
              </div>
            ) : expenses.length === 0 ? (
              <div className="stat-card" style={{ padding: "40px", textAlign: "center" }}>
                <h3>No expense records available.</h3>
                <p>Use the Add Expense page to log entries.</p>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>₹{totalExpense.toLocaleString()}</h3>
                    <p>Total Expenses</p>
                  </div>

                  <div className="stat-card">
                    <h3>{expenses.length}</h3>
                    <p>Total Entries</p>
                  </div>
                </div>

                <div className="table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Entry Type</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((item) => (
                        <tr key={item.id}>
                          <td>{item.expense_date}</td>
                          <td>{item.category}</td>
                          <td>₹{Number(item.amount).toLocaleString()}</td>
                          <td style={{ textTransform: "capitalize" }}>{item.entry_type || "manual"}</td>
                          <td>{item.status}</td>
                          <td>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              {item.status === "Pending" && (
                                <button
                                  className="dashboard-btn"
                                  style={{ padding: "8px 15px", margin: 0 }}
                                  onClick={() => markPaid(item.id)}
                                >
                                  Mark Paid
                                </button>
                              )}
                              {item.expense_documents && item.expense_documents.length > 0 && (
                                <a
                                  href={item.expense_documents[0].file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="dashboard-btn"
                                  style={{
                                    padding: "8px 12px",
                                    fontSize: "12px",
                                    textDecoration: "none",
                                    background: "rgba(255, 255, 255, 0.08) !important",
                                    margin: 0
                                  }}
                                >
                                  📎 View Bill
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {fetchError ? (
              <div className="stat-card" style={{ padding: "40px", textAlign: "center", border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.05)" }}>
                <h3 style={{ color: "#f87171" }}>Error Loading Analytics</h3>
                <p style={{ color: "#fca5a5", marginBottom: "15px" }}>{fetchError}</p>
                <button className="dashboard-btn" onClick={fetchExpenses} style={{ margin: "0 auto" }}>Retry Fetch</button>
              </div>
            ) : expenses.length === 0 ? (
              <div className="stat-card" style={{ padding: "40px", textAlign: "center" }}>
                <h3>No expense records available.</h3>
                <p>Please log factory expenses to view summaries and breakdowns.</p>
              </div>
            ) : (
              <>
                {/* Metrics Summary Cards */}
                <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                  <div className="stat-card">
                    <h3>₹{analytics.averageMonthly.toLocaleString()}</h3>
                    <p>Average Monthly Expense</p>
                  </div>

                  <div className="stat-card">
                    <h3>₹{analytics.highestMonthAmount.toLocaleString()}</h3>
                    <p>Highest Month ({analytics.highestMonthLabel})</p>
                  </div>

                  <div className="stat-card">
                    <h3>{analytics.highestCategoryName}</h3>
                    <p>Largest Cost Category (₹{analytics.highestCategoryAmount.toLocaleString()})</p>
                  </div>
                </div>

                {/* MoM Change Alerts & Factory Owner Insights */}
                <div>
                  <h2 style={{ fontSize: "20px", marginBottom: "15px", color: "#f8fafc" }}>Factory Owner Insights</h2>
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
                            backdropFilter: "blur(8px)"
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
                  </div>
                </div>

                {/* Dynamic predictions box */}
                <div style={{ marginTop: "10px" }}>
                  {analytics.monthsCount < 3 ? (
                    <div style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      color: "#cbd5e1"
                    }}>
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
                        gap: "15px"
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
                </div>

                {/* Simple Visualisations Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginTop: "10px" }}>
                  {/* Chart 1: Total Monthly spend */}
                  <div className="table-container" style={{ padding: "20px", height: "360px" }}>
                    <h3 style={{ marginBottom: "15px", fontSize: "15px", color: "#f8fafc" }}>
                      Total Monthly Outflow (Actual spend)
                    </h3>
                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={analytics.monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="Expenses" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart 2: Category breakdown */}
                  <div className="table-container" style={{ padding: "20px", height: "360px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <h3 style={{ fontSize: "15px", color: "#f8fafc", margin: 0 }}>
                          Breakdown by Category
                        </h3>
                        {analytics.activeMonth && (
                          <span style={{
                            background: "rgba(59, 130, 246, 0.15)",
                            color: "#60a5fa",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "600"
                          }}>
                            Showing {getMonthName(analytics.activeMonth)} Expenses
                          </span>
                        )}
                      </div>
                      
                      {analytics.sortedMonths && analytics.sortedMonths.length > 0 && (
                        <select
                          value={analytics.activeMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          style={{
                            background: "rgba(15, 23, 42, 0.9)",
                            color: "#e2e8f0",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            cursor: "pointer",
                            outline: "none"
                          }}
                        >
                          {analytics.sortedMonths.map(m => (
                            <option key={m} value={m} style={{ background: "#0f172a", color: "#e2e8f0" }}>
                              {getMonthName(m)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {analytics.categoryBreakdownData.length === 0 ? (
                      <div style={{ textAlign: "center", paddingTop: "80px", color: "#cbd5e1" }}>
                        No category breakdown available for the selected month.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={analytics.categoryBreakdownData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                          <YAxis dataKey="name" type="category" tick={{ fill: "#9ca3af", fontSize: 11 }} width={90} />
                          <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Payout"]} />
                          <Bar dataKey="Amount" radius={[0, 4, 4, 0]}>
                            {analytics.categoryBreakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Expenses;