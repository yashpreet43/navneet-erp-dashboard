import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/common/PageHeader";
import FadeContent from "../components/animations/FadeContent";
import GlassCard from "../components/common/GlassCard";
import DataTable from "../components/common/DataTable";
import GlassModal from "../components/common/GlassModal";
import StatusBadge from "../components/common/StatusBadge";
import { FormInput, FormSelect, FormTextarea, FormDatePicker, FormButton } from "../components/common/FormComponents";
import { supabase } from "../supabaseClient";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*");

    setIsLoading(false);
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
    fetchSalaryHistory(selectedEmployee.id);
    setShowHistoryModal(true);
  }

  const columns = [
    { header: "Name", key: "employee_name" },
    { header: "Designation", key: "designation" },
    {
      header: "Salary",
      render: (item) => <span style={{ fontWeight: 700 }}>₹{Number(item.salary || 0).toLocaleString()}</span>
    },
    { header: "Type", key: "type" },
    {
      header: "Status",
      render: (item) => <StatusBadge status={item.payment_status} />
    },
    {
      header: "Action",
      render: (item) => (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <FormButton
            variant="primary"
            style={{ padding: "6px 12px", fontSize: "12.5px" }}
            onClick={() => {
              setSelectedEmployee(item);
              setNewSalary("");
              setRevisionType("Increment");
              setIncrementReason("");
              setEffectiveDate(new Date().toISOString().split("T")[0]);
              setErrorMessage("");
              setShowUpdateModal(true);
            }}
          >
            Update Salary
          </FormButton>
          <FormButton
            variant="secondary"
            style={{ padding: "6px 12.5px", fontSize: "12.5px" }}
            onClick={() => {
              setSelectedEmployee(item);
              fetchSalaryHistory(item.id);
              setShowHistoryModal(true);
            }}
          >
            History
          </FormButton>
        </div>
      )
    }
  ];

  const historyColumns = [
    { header: "Effective Date", key: "effective_date" },
    { header: "Revision Type", render: (item) => item.revision_type || "N/A" },
    {
      header: "Old Salary",
      render: (item) => `₹${Number(item.old_salary || 0).toLocaleString()}`
    },
    {
      header: "New Salary",
      render: (item) => `₹${Number(item.new_salary || 0).toLocaleString()}`
    },
    {
      header: "Change",
      render: (item) => {
        const change = item.salary_change !== undefined ? item.salary_change : (item.new_salary - item.old_salary);
        const isPositive = change >= 0;
        return (
          <span style={{ color: isPositive ? "#34d399" : "#f87171", fontWeight: "600" }}>
            {isPositive ? "+" : ""}₹{Number(change).toLocaleString()}
          </span>
        );
      }
    },
    {
      header: "Reason",
      render: (item) => (
        <div style={{ whiteSpace: "normal", maxWidth: "200px", fontSize: "13px" }}>{item.reason}</div>
      )
    }
  ];

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <FadeContent blur={true} duration={800} initialOpacity={0}>
          <PageHeader
            title="Employees"
            subtitle="Manage workforce payroll, designation tracking, and salary history."
          />

          <GlassCard title="Workforce Directory" subtitle="List of currently active and contracted factory staff.">
            <DataTable
              columns={columns}
              data={employees}
              isLoading={isLoading}
              emptyMessage="No employees found."
            />
          </GlassCard>
        </FadeContent>
      </div>

      {/* Update Salary Modal */}
      <GlassModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title={`Update Salary - ${selectedEmployee?.employee_name}`}
      >
        {errorMessage && (
          <p style={{ color: "#ef4444", marginBottom: "15px", fontSize: "14px" }}>{errorMessage}</p>
        )}
        <form onSubmit={submitSalaryUpdate} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <FormInput
            label="Current Salary"
            value={`₹${Number(selectedEmployee?.salary || 0).toLocaleString()}`}
            disabled
            style={{ opacity: 0.7 }}
          />

          <FormInput
            label="New Salary (₹)"
            type="number"
            placeholder="Enter new salary"
            value={newSalary}
            onChange={(e) => setNewSalary(e.target.value)}
            required
            min="1"
          />

          <FormSelect
            label="Revision Type"
            value={revisionType}
            onChange={(e) => setRevisionType(e.target.value)}
            required
          >
            <option value="Increment">Increment</option>
            <option value="Promotion">Promotion</option>
            <option value="Adjustment">Adjustment</option>
            <option value="Role Change">Role Change</option>
            <option value="Market Correction">Market Correction</option>
          </FormSelect>

          <FormTextarea
            label="Reason / Comments"
            placeholder="Provide details about this salary update"
            value={incrementReason}
            onChange={(e) => setIncrementReason(e.target.value)}
            required
          />

          <FormDatePicker
            label="Effective Date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            required
          />

          <div style={{ display: "flex", gap: "10px", marginTop: "15px", justifyContent: "flex-end" }}>
            <FormButton type="button" variant="secondary" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </FormButton>
            <FormButton type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update"}
            </FormButton>
          </div>
        </form>
      </GlassModal>

      {/* Salary History Modal */}
      <GlassModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`Salary History - ${selectedEmployee?.employee_name}`}
        maxWidth="750px"
      >
        <span style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "15px", marginTop: "-10px" }}>
          {selectedEmployee?.designation}
        </span>
        {errorMessage && (
          <p style={{ color: "#ef4444", marginBottom: "15px", fontSize: "14px" }}>{errorMessage}</p>
        )}

        <DataTable
          columns={historyColumns}
          data={salaryHistory}
          isLoading={isLoadingHistory}
          emptyMessage="No salary history found for this employee."
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <FormButton variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Close
          </FormButton>
        </div>
      </GlassModal>
    </div>
  );
}

export default Employees;