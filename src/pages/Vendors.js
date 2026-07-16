import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/common/PageHeader";
import FadeContent from "../components/animations/FadeContent";
import GlassCard from "../components/common/GlassCard";
import DataTable from "../components/common/DataTable";
import GlassModal from "../components/common/GlassModal";
import StatusBadge from "../components/common/StatusBadge";
import KPICard from "../components/common/KPICard";
import { FormInput, FormTextarea, FormDatePicker, FormButton } from "../components/common/FormComponents";
import { supabase } from "../supabaseClient";
import theme from "../styles/theme";

function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("*");

    const { data: historyData, error: historyError } = await supabase
      .from("vendor_purchase_history")
      .select("*")
      .order("purchase_date", { ascending: false })
      .order("created_at", { ascending: false });

    setIsLoading(false);
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

    // 1. Insert record into vendor_purchase_history
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
        remarks: remarks,
        purchase_date: purchaseDate
      });

    if (historyError) {
      console.error("Error inserting purchase history:", historyError);
      setErrorMessage("Failed to create history record: " + (historyError.message || ""));
      setIsSubmitting(false);
      return;
    }

    // 2. Update current vendor quantities in vendors table
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
      setErrorMessage("History saved, but failed to update vendor stats.");
      return;
    }

    // Success
    setShowUpdateModal(false);
    fetchVendors();
    fetchPurchaseHistory(selectedVendor.id);
    setShowHistoryModal(true);
  }

  // Calculate averages & Supplier KPIs
  const totalSuppliers = vendors.length;
  const averageRate =
    vendors.length > 0
      ? (vendors.reduce((sum, v) => sum + Number(v.rate || 0), 0) / vendors.length).toFixed(2)
      : "0.00";

  let topSupplierName = "None";
  let maxQty = 0;
  vendors.forEach((v) => {
    if (Number(v.quantity) > maxQty) {
      maxQty = Number(v.quantity);
      topSupplierName = v.vendor_name;
    }
  });

  // Calculate historical metrics per vendor
  const getVendorMetrics = (vendor) => {
    const history = allHistory.filter((h) => h.vendor_id === vendor.id);
    const count = history.length;

    if (count === 0) {
      return {
        avgQty: vendor.quantity,
        avgRate: vendor.rate,
        avgFreq: vendor.frequency || 0,
        avgEfficiency: (Number(vendor.quantity) / (Number(vendor.frequency || 0) || 1)).toFixed(2),
        estCost: Number(vendor.quantity) * 1000 * Number(vendor.rate) // ton to kg is *1000
      };
    }

    const totalQty = history.reduce((sum, h) => sum + Number(h.new_quantity), 0);
    const totalRate = history.reduce((sum, h) => sum + Number(h.new_rate), 0);
    const totalFreq = history.reduce((sum, h) => sum + Number(h.new_frequency), 0);

    const avgQty = (totalQty / count).toFixed(2);
    const avgRate = (totalRate / count).toFixed(2);
    const avgFreq = (totalFreq / count).toFixed(1);
    const avgEfficiency = (totalQty / (totalFreq || 1)).toFixed(2);
    const estCost = Number(vendor.quantity) * 1000 * Number(vendor.rate);

    return {
      avgQty,
      avgRate,
      avgFreq,
      avgEfficiency,
      estCost
    };
  };

  const mainColumns = [
    { header: "Vendor", key: "vendor_name", style: { fontWeight: "600" } },
    {
      header: "Quantity",
      render: (item) => {
        const metrics = getVendorMetrics(item);
        return (
          <div>
            <div>{item.quantity} Ton</div>
            <div style={{ fontSize: "11px", color: theme.colors.textMuted, marginTop: "2px" }}>
              Avg: {metrics.avgQty} T/mo
            </div>
          </div>
        );
      }
    },
    {
      header: "Rate",
      render: (item) => {
        const metrics = getVendorMetrics(item);
        return (
          <div>
            <div>₹{item.rate}/kg</div>
            <div style={{ fontSize: "11px", color: theme.colors.textMuted, marginTop: "2px" }}>
              Avg: ₹{metrics.avgRate}/kg
            </div>
          </div>
        );
      }
    },
    {
      header: "Frequency (per mo)",
      render: (item) => {
        const metrics = getVendorMetrics(item);
        return (
          <div>
            <div>{item.frequency || 0}</div>
            <div style={{ fontSize: "11px", color: theme.colors.textMuted, marginTop: "2px" }}>
              Avg: {metrics.avgFreq}/mo
            </div>
          </div>
        );
      }
    },
    {
      header: "Est. Monthly Cost",
      render: (item) => {
        const metrics = getVendorMetrics(item);
        return (
          <span style={{ fontWeight: "600", color: "#34d399" }}>
            ₹{Math.round(metrics.estCost).toLocaleString("en-IN")}
          </span>
        );
      }
    },
    {
      header: "Procurement Efficiency",
      render: (item) => {
        const metrics = getVendorMetrics(item);
        return (
          <div>
            <div>{(Number(item.quantity) / (Number(item.frequency || 0) || 1)).toFixed(2)} T/order</div>
            <div style={{ fontSize: "11px", color: theme.colors.textMuted, marginTop: "2px" }}>
              Avg: {metrics.avgEfficiency} T/order
            </div>
          </div>
        );
      }
    },
    { header: "Material", key: "material" },
    {
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />
    },
    {
      header: "Action",
      render: (item) => (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <FormButton
            variant="primary"
            style={{ padding: "6px 12px", fontSize: "12.5px" }}
            onClick={() => {
              setSelectedVendor(item);
              setNewQuantity(item.quantity.toString());
              setNewRate(item.rate.toString());
              setNewFrequency((item.frequency || 0).toString());
              setRemarks("");
              setPurchaseDate(new Date().toISOString().split("T")[0]);
              setErrorMessage("");
              setShowUpdateModal(true);
            }}
          >
            Update Vendor
          </FormButton>
          <FormButton
            variant="secondary"
            style={{ padding: "6px 12.5px", fontSize: "12.5px" }}
            onClick={() => {
              setSelectedVendor(item);
              fetchPurchaseHistory(item.id);
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
    { header: "Date", key: "purchase_date" },
    {
      header: "Quantity",
      render: (item) => (
        <span style={{ fontWeight: "600", color: item.new_quantity >= item.old_quantity ? "#34d399" : "#f87171" }}>
          {item.new_quantity} T (was {item.old_quantity} T)
        </span>
      )
    },
    {
      header: "Frequency",
      render: (item) => (
        <span style={{ fontWeight: "600", color: item.new_frequency >= item.old_frequency ? "#34d399" : "#f87171" }}>
          {item.new_frequency} (was {item.old_frequency})
        </span>
      )
    },
    {
      header: "Rate",
      render: (item) => (
        <span style={{ fontWeight: "600", color: item.new_rate >= item.old_rate ? "#34d399" : "#f87171" }}>
          ₹{item.new_rate} (was ₹{item.old_rate})
        </span>
      )
    },
    {
      header: "Remarks",
      render: (item) => (
        <div style={{ whiteSpace: "normal", maxWidth: "160px", fontSize: "13px" }}>{item.remarks}</div>
      )
    }
  ];

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <FadeContent blur={true} duration={800} initialOpacity={0}>
          <PageHeader
            title="Vendors"
            subtitle="Track raw material suppliers, catalog prices, and procurement efficiency."
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "25px" }}>
            <KPICard title="Total Suppliers" value={totalSuppliers} statusColor="#3b82f6" loading={isLoading} />
            <KPICard title="Average Rate" value={`₹${averageRate}/kg`} statusColor="#fbbf24" loading={isLoading} />
            <KPICard title="Top Supplier" value={topSupplierName} statusColor="#10b981" loading={isLoading} />
          </div>

          <GlassCard title="Vendor Registry" subtitle="Historical rates, volumes, and material suppliers list.">
            <DataTable
              columns={mainColumns}
              data={vendors}
              isLoading={isLoading}
              emptyMessage="No vendors found."
            />
          </GlassCard>
        </FadeContent>
      </div>

      {/* Update Vendor Modal */}
      <GlassModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title={`Update Vendor - ${selectedVendor?.vendor_name}`}
      >
        {errorMessage && (
          <p style={{ color: "#ef4444", marginBottom: "15px", fontSize: "14px" }}>{errorMessage}</p>
        )}
        <form onSubmit={submitVendorUpdate} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <FormInput
            label="Quantity (Ton)"
            type="number"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            required
            min="1"
          />

          <FormInput
            label="Rate (₹/kg)"
            type="number"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            required
            min="0.1"
            step="0.01"
          />

          <FormInput
            label="Frequency (Purchases/mo)"
            type="number"
            value={newFrequency}
            onChange={(e) => setNewFrequency(e.target.value)}
            required
            min="1"
          />

          <FormTextarea
            label="Remarks"
            placeholder="Reason for change, quality details etc."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            required
          />

          <FormDatePicker
            label="Purchase Date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
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

      {/* Purchase History Modal */}
      <GlassModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`Purchase History - ${selectedVendor?.vendor_name}`}
        maxWidth="750px"
      >
        <span style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "15px", marginTop: "-10px" }}>
          Material: {selectedVendor?.material}
        </span>
        {errorMessage && (
          <p style={{ color: "#ef4444", marginBottom: "15px", fontSize: "14px" }}>{errorMessage}</p>
        )}

        <DataTable
          columns={historyColumns}
          data={purchaseHistory}
          isLoading={isLoadingHistory}
          emptyMessage="No purchase history found for this vendor."
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

export default Vendors;