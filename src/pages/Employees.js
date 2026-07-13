import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "../components/Sidebar";
import { supabase } from "../supabaseClient";

const modalOverlayStyle = {
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
  padding: "20px"
};

const modalContentStyle = {
  background: "rgba(255, 255, 255, 0.06)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "20px",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
  padding: "30px",
  maxWidth: "500px",
  width: "100%",
  color: "#f3f4f6",
  maxHeight: "90vh",
  overflowY: "auto"
};

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form states
  const [newSalary, setNewSalary] = useState("");
  const [revisionType, setRevisionType] = useState("Increment");
  const [incrementReason, setIncrementReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);

  // History & loading states
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from("employees")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    setEmployees(data || []);
  }



  async function fetchSalaryHistory(employeeId) {
    setIsLoadingHistory(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("salary_history")
      .select("*")
      .eq("employee_id", employeeId)
      .order("effective_date", { ascending: false })
      .order("created_at", { ascending: false });

    setIsLoadingHistory(false);
    if (error) {
      console.error("Error fetching salary history:", error);
      setErrorMessage("Failed to load salary history.");
    } else {
      setSalaryHistory(data || []);
    }
  }

  async function submitSalaryUpdate(e) {
    e.preventDefault();
    if (!selectedEmployee) return;

    const oldSalary = Number(selectedEmployee.salary || 0);
    const newSalaryNum = Number(newSalary);

    if (isNaN(newSalaryNum) || newSalaryNum <= 0) {
      setErrorMessage("Please enter a valid positive salary amount.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const salaryChange = newSalaryNum - oldSalary;

    // 1. Insert into salary_history
    const { error: historyError } = await supabase
      .from("salary_history")
      .insert({
        employee_id: selectedEmployee.id,
        old_salary: oldSalary,
        new_salary: newSalaryNum,
        salary_change: salaryChange,
        reason: incrementReason,
        revision_type: revisionType,
        effective_date: effectiveDate
      });

    if (historyError) {
      console.error("Error inserting salary history:", historyError);
      setErrorMessage("Failed to create salary history record: " + (historyError.message || ""));
      setIsSubmitting(false);
      return;
    }

    // 2. Update employee current salary
    const { error: employeeError } = await supabase
      .from("employees")
      .update({
        salary: newSalaryNum
      })
      .eq("id", selectedEmployee.id);

    setIsSubmitting(false);

    if (employeeError) {
      console.error("Error updating employee salary:", employeeError);
      setErrorMessage("Salary history saved, but failed to update employee salary.");
      return;
    }

    // Success
    setShowUpdateModal(false);
    fetchEmployees();
    
    // Automatically fetch history and show the modal for user feedback
    fetchSalaryHistory(selectedEmployee.id);
    setShowHistoryModal(true);
  }

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <h1>Employee Management</h1>

        <div className="table-container">
          <table className="machine-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Salary</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.employee_name}</td>
                  <td>{emp.designation}</td>
                  <td>₹{emp.salary}</td>
                  <td>{emp.type}</td>
                  <td>{emp.payment_status}</td>
                  <td>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>

                      <button
                        className="dashboard-btn"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setNewSalary("");
                          setRevisionType("Increment");
                          setIncrementReason("");
                          setEffectiveDate(new Date().toISOString().split("T")[0]);
                          setErrorMessage("");
                          setShowUpdateModal(true);
                        }}
                      >
                        Update Salary
                      </button>
                      <button
                        className="dashboard-btn"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          fetchSalaryHistory(emp.id);
                          setShowHistoryModal(true);
                        }}
                      >
                        History
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {/* Update Salary Modal */}
        {showUpdateModal && selectedEmployee && (
          <motion.div
            style={modalOverlayStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={modalContentStyle}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 style={{ marginBottom: "20px" }}>Update Salary - {selectedEmployee.employee_name}</h2>
              {errorMessage && (
                <p style={{ color: "#f87171", marginBottom: "15px", fontSize: "14px" }}>
                  {errorMessage}
                </p>
              )}
              <form onSubmit={submitSalaryUpdate} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Current Salary</label>
                  <input
                    type="text"
                    value={`₹${selectedEmployee.salary}`}
                    disabled
                    style={{ opacity: 0.7 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "14px", color: "#cbd5e1" }}>New Salary (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter new salary"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Revision Type</label>
                  <select
                    value={revisionType}
                    onChange={(e) => setRevisionType(e.target.value)}
                    required
                  >
                    <option value="Increment">Increment</option>
                    <option value="Promotion">Promotion</option>
                    <option value="Adjustment">Adjustment</option>
                    <option value="Role Change">Role Change</option>
                    <option value="Market Correction">Market Correction</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Reason / Comments</label>
                  <textarea
                    placeholder="Provide details about this salary update"
                    value={incrementReason}
                    onChange={(e) => setIncrementReason(e.target.value)}
                    required
                    rows="3"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Effective Date</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "15px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="dashboard-btn"
                    style={{ background: "rgba(255,255,255,0.1) !important" }}
                    onClick={() => setShowUpdateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="dashboard-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Salary History Modal */}
        {showHistoryModal && selectedEmployee && (
          <motion.div
            style={modalOverlayStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={{ ...modalContentStyle, maxWidth: "700px" }}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0 }}>Salary History - {selectedEmployee.employee_name}</h2>
                <span style={{ fontSize: "14px", color: "#9ca3af" }}>{selectedEmployee.designation}</span>
              </div>
              
              {errorMessage && (
                <p style={{ color: "#f87171", marginBottom: "15px", fontSize: "14px" }}>
                  {errorMessage}
                </p>
              )}
              
              {isLoadingHistory ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#cbd5e1" }}>
                  Loading history...
                </div>
              ) : salaryHistory.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#cbd5e1" }}>
                  No salary history found for this employee.
                </div>
              ) : (
                <div className="table-container" style={{ marginTop: "0", maxHeight: "350px", overflowY: "auto" }}>
                  <table className="machine-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Effective Date</th>
                        <th>Revision Type</th>
                        <th>Old Salary</th>
                        <th>New Salary</th>
                        <th>Change</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryHistory.map((history) => {
                        const change = history.salary_change !== undefined ? history.salary_change : (history.new_salary - history.old_salary);
                        const isPositive = change >= 0;
                        return (
                          <tr key={history.id}>
                            <td>{history.effective_date}</td>
                            <td>{history.revision_type || "N/A"}</td>
                            <td>₹{history.old_salary}</td>
                            <td>₹{history.new_salary}</td>
                            <td style={{ color: isPositive ? "#4ade80" : "#f87171", fontWeight: "600" }}>
                              {isPositive ? "+" : ""}₹{change}
                            </td>
                            <td style={{ whiteSpace: "normal", maxWidth: "200px" }}>{history.reason}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  className="dashboard-btn"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Employees;