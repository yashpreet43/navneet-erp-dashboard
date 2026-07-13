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

function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form states
  const [newQuantity, setNewQuantity] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newFrequency, setNewFrequency] = useState("");
  const [remarks, setRemarks] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);

  // History & loading states
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("*");

    const { data: historyData, error: historyError } = await supabase
      .from("vendor_purchase_history")
      .select("*")
      .order("purchase_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!vendorError) {
      setVendors(vendorData || []);
    }
    if (!historyError) {
      setAllHistory(historyData || []);
    }
  }

  async function fetchPurchaseHistory(vendorId) {
    setIsLoadingHistory(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("vendor_purchase_history")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("purchase_date", { ascending: false })
      .order("created_at", { ascending: false });

    setIsLoadingHistory(false);
    if (error) {
      console.error("Error fetching purchase history:", error);
      setErrorMessage("Failed to load purchase history.");
    } else {
      setPurchaseHistory(data || []);
    }
  }

  async function submitVendorUpdate(e) {
    e.preventDefault();
    if (!selectedVendor) return;

    const oldQuantity = Number(selectedVendor.quantity || 0);
    const newQuantityNum = Number(newQuantity);
    const oldRate = Number(selectedVendor.rate || 0);
    const newRateNum = Number(newRate);
    const oldFrequency = Number(selectedVendor.frequency || 0);
    const newFrequencyNum = Number(newFrequency);

    if (isNaN(newQuantityNum) || newQuantityNum <= 0) {
      setErrorMessage("Please enter a valid positive quantity.");
      return;
    }
    if (isNaN(newRateNum) || newRateNum <= 0) {
      setErrorMessage("Please enter a valid positive rate.");
      return;
    }
    if (isNaN(newFrequencyNum) || newFrequencyNum <= 0 || !Number.isInteger(newFrequencyNum)) {
      setErrorMessage("Please enter a valid positive integer frequency (purchases per month).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    // 1. Insert into vendor_purchase_history
    const { error: historyError } = await supabase
      .from("vendor_purchase_history")
      .insert({
        vendor_id: selectedVendor.id,
        old_quantity: oldQuantity,
        new_quantity: newQuantityNum,
        old_rate: oldRate,
        new_rate: newRateNum,
        old_frequency: oldFrequency,
        new_frequency: newFrequencyNum,
        purchase_date: purchaseDate,
        remarks: remarks
      });

    if (historyError) {
      console.error("Error inserting purchase history:", historyError);
      setErrorMessage("Failed to save purchase history: " + (historyError.message || ""));
      setIsSubmitting(false);
      return;
    }

    // 2. Update vendors table
    const { error: vendorError } = await supabase
      .from("vendors")
      .update({
        quantity: newQuantityNum,
        rate: newRateNum,
        frequency: newFrequencyNum
      })
      .eq("id", selectedVendor.id);

    setIsSubmitting(false);

    if (vendorError) {
      console.error("Error updating vendor:", vendorError);
      setErrorMessage("History saved, but failed to update vendor values.");
      return;
    }

    // Success
    setShowUpdateModal(false);
    fetchVendors();
    
    // Automatically fetch history and show the modal for user feedback
    fetchPurchaseHistory(selectedVendor.id);
    setShowHistoryModal(true);
  }

  // Dynamic Statistics Calculations (Aggregated)
  const totalSuppliers = vendors.length;
  
  const monthlyMaterial = vendors.reduce(
    (sum, v) => sum + Number(v.quantity || 0),
    0
  );

  const averageRate = vendors.length > 0 
    ? Math.round(vendors.reduce((sum, v) => sum + Number(v.rate || 0), 0) / vendors.length)
    : 0;

  const topSupplierName = (() => {
    if (vendors.length === 0) return "N/A";
    let maxCost = -1;
    let bestVendor = "N/A";
    vendors.forEach((v) => {
      const qty = Number(v.quantity || 0);
      const rate = Number(v.rate || 0);
      const cost = qty * rate * 1000;
      if (cost > maxCost) {
        maxCost = cost;
        bestVendor = v.vendor_name;
      }
    });
    return bestVendor;
  })();

  // Helper to calculate inline metrics for each vendor row
  const getVendorMetrics = (vendor) => {
    const vendorHistory = allHistory.filter((h) => h.vendor_id === vendor.id);
    const count = vendorHistory.length;
    
    const avgRate = count > 0
      ? Math.round(vendorHistory.reduce((sum, h) => sum + Number(h.new_rate || 0), 0) / count)
      : vendor.rate;

    const avgQty = count > 0
      ? (vendorHistory.reduce((sum, h) => sum + Number(h.new_quantity || 0), 0) / count).toFixed(1)
      : Number(vendor.quantity).toFixed(1);

    const avgFreq = count > 0
      ? (vendorHistory.reduce((sum, h) => sum + Number(h.new_frequency || 0), 0) / count).toFixed(1)
      : Number(vendor.frequency || 0).toFixed(1);

    const avgEfficiency = count > 0
      ? (vendorHistory.reduce((sum, h) => sum + (Number(h.new_quantity || 0) / (Number(h.new_frequency || 0) || 1)), 0) / count).toFixed(2)
      : (Number(vendor.quantity) / (Number(vendor.frequency || 0) || 1)).toFixed(2);

    const latestEntry = vendorHistory[0] || null;
    const latestQty = latestEntry ? latestEntry.new_quantity : vendor.quantity;
    const latestRate = latestEntry ? latestEntry.new_rate : vendor.rate;
    const estCost = latestQty * latestRate * 1000;

    return { avgRate, avgQty, avgFreq, avgEfficiency, estCost };
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <h1>Vendor Management</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>{totalSuppliers}</h3>
            <p>Suppliers</p>
          </div>

          <div className="stat-card">
            <h3>{monthlyMaterial} T</h3>
            <p>Monthly Material</p>
          </div>

          <div className="stat-card">
            <h3>₹{averageRate}</h3>
            <p>Average Rate</p>
          </div>

          <div className="stat-card">
            <h3 style={{ fontSize: "18px", wordBreak: "break-all" }}>{topSupplierName}</h3>
            <p>Top Supplier</p>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Vendors</h2>

          <div className="table-container">
            <table className="machine-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Frequency (per mo)</th>
                  <th>Est. Monthly Cost</th>
                  <th>Procurement Efficiency</th>
                  <th>Material</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => {
                  const metrics = getVendorMetrics(vendor);
                  return (
                    <tr key={vendor.id}>
                      <td style={{ fontWeight: "600" }}>{vendor.vendor_name}</td>
                      <td>
                        <div>
                          <div>{vendor.quantity} Ton</div>
                          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                            Avg: {metrics.avgQty} T/mo
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>₹{vendor.rate}/kg</div>
                          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                            Avg: ₹{metrics.avgRate}/kg
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{vendor.frequency || 0}</div>
                          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                            Avg: {metrics.avgFreq}/mo
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: "600", color: "#4ade80" }}>
                          ₹{Math.round(metrics.estCost).toLocaleString("en-IN")}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{(Number(vendor.quantity) / (Number(vendor.frequency || 0) || 1)).toFixed(2)} T/order</div>
                          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                            Avg: {metrics.avgEfficiency} T/order
                          </div>
                        </div>
                      </td>
                      <td>{vendor.material}</td>
                      <td>{vendor.status}</td>
                      <td>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            className="dashboard-btn"
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setNewQuantity(vendor.quantity.toString());
                              setNewRate(vendor.rate.toString());
                              setNewFrequency((vendor.frequency || 0).toString());
                              setRemarks("");
                              setPurchaseDate(new Date().toISOString().split("T")[0]);
                              setErrorMessage("");
                              setShowUpdateModal(true);
                            }}
                          >
                            Update Vendor
                          </button>
                          <button
                            className="dashboard-btn"
                            onClick={() => {
                              setSelectedVendor(vendor);
                              fetchPurchaseHistory(vendor.id);
                              setShowHistoryModal(true);
                            }}
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {/* Update Vendor Modal */}
        {showUpdateModal && selectedVendor && (
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
              <h2 style={{ marginBottom: "20px" }}>Update Vendor - {selectedVendor.vendor_name}</h2>
              {errorMessage && (
                <p style={{ color: "#f87171", marginBottom: "15px", fontSize: "14px" }}>
                  {errorMessage}
                </p>
              )}
              <form onSubmit={submitVendorUpdate} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
                    <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Current Quantity</label>
                    <input
                      type="text"
                      value={`${selectedVendor.quantity} Ton`}
                      disabled
                      style={{ opacity: 0.7 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
                    <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Current Rate</label>
                    <input
                      type="text"
                      value={`₹${selectedVendor.rate}/kg`}
                      disabled
                      style={{ opacity: 0.7 }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
                    <label style={{ fontSize: "14px", color: "#cbd5e1" }}>New Quantity (Ton)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 5.5"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      required
                      min="0.01"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
                    <label style={{ fontSize: "14px", color: "#cbd5e1" }}>New Rate (₹/kg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 55"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "14px", color: "#cbd5e1" }}>New Frequency (purchases / mo)</label>
                  <input
                    type="number"
                    placeholder="e.g. 3"
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    required
                    min="1"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Remarks / Comments</label>
                  <textarea
                    placeholder="Reason for rate/quantity changes"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    required
                    rows="3"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
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

        {/* Purchase History Modal */}
        {showHistoryModal && selectedVendor && (
          <motion.div
            style={modalOverlayStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={{ ...modalContentStyle, maxWidth: "750px" }}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0 }}>Purchase History - {selectedVendor.vendor_name}</h2>
                <span style={{ fontSize: "14px", color: "#9ca3af" }}>Material: {selectedVendor.material}</span>
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
              ) : purchaseHistory.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#cbd5e1" }}>
                  No purchase history found for this vendor.
                </div>
              ) : (
                <div className="table-container" style={{ marginTop: "0", maxHeight: "350px", overflowY: "auto" }}>
                  <table className="machine-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Old Qty</th>
                        <th>New Qty</th>
                        <th>Old Freq</th>
                        <th>New Freq</th>
                        <th>Old Rate</th>
                        <th>New Rate</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseHistory.map((history) => (
                        <tr key={history.id}>
                          <td>{history.purchase_date}</td>
                          <td>{history.old_quantity} T</td>
                          <td style={{ fontWeight: "600", color: history.new_quantity >= history.old_quantity ? "#4ade80" : "#f87171" }}>
                            {history.new_quantity} T
                          </td>
                          <td>{history.old_frequency}</td>
                          <td style={{ fontWeight: "600", color: history.new_frequency >= history.old_frequency ? "#4ade80" : "#f87171" }}>
                            {history.new_frequency}
                          </td>
                          <td>₹{history.old_rate}</td>
                          <td style={{ fontWeight: "600", color: history.new_rate >= history.old_rate ? "#4ade80" : "#f87171" }}>
                            ₹{history.new_rate}
                          </td>
                          <td style={{ whiteSpace: "normal", maxWidth: "160px" }}>{history.remarks}</td>
                        </tr>
                      ))}
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

export default Vendors;