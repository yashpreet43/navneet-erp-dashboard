import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/common/PageHeader";
import FadeContent from "../components/animations/FadeContent";
import GlassCard from "../components/common/GlassCard";
import DataTable from "../components/common/DataTable";
import { FormInput, FormSelect, FormButton } from "../components/common/FormComponents";
import { supabase } from "../supabaseClient";
import StatusBadge from "../components/common/StatusBadge";

function PendingOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [compSearch, setCompSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOrders();

    // Subscribe to dispatches and purchase_order_items changes to auto-update
    const channel = supabase
      .channel("pending_orders_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dispatches" },
        () => fetchOrders()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "purchase_order_items" },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    
    // Fetch all PO items
    const { data: poItems, error: poError } = await supabase
      .from("purchase_order_items")
      .select(`
        id,
        ordered_qty,
        rate,
        components (
          component_name
        ),
        purchase_orders (
          po_number,
          po_date,
          plant
        )
      `);

    if (poError) {
      console.error(poError);
      setIsLoading(false);
      return;
    }

    // Fetch all dispatches
    const { data: dispatchesData, error: dispatchError } = await supabase
      .from("dispatches")
      .select("purchase_order_item_id, dispatched_qty");

    setIsLoading(false);
    if (dispatchError) {
      console.error(dispatchError);
      return;
    }

    // Map each PO item to its status and remaining quantity
    const activeItems = (poItems || []).map(item => {
      const itemDispatches = (dispatchesData || []).filter(d => d.purchase_order_item_id === item.id);
      const dispatchedQty = itemDispatches.reduce((sum, d) => sum + Number(d.dispatched_qty || 0), 0);
      const remainingQty = Number(item.ordered_qty || 0) - dispatchedQty;
      
      let status = "Pending";
      if (dispatchedQty === 0) {
        status = "Pending";
      } else if (dispatchedQty > 0 && remainingQty > 0) {
        status = "In Production";
      } else if (remainingQty <= 0) {
        status = "Completed";
      }

      const orderData = {
        id: item.id,
        po_number: item.purchase_orders?.po_number || "Legacy Order",
        po_date: item.purchase_orders?.po_date || "N/A",
        plant: item.purchase_orders?.plant || "N/A",
        component: item.components?.component_name || "Unknown Component",
        ordered_qty: item.ordered_qty,
        pending_qty: remainingQty,
        status
      };

      // Temporary debug logging as requested by user
      console.log("order:", orderData);
      console.log("ordered_quantity:", item.ordered_qty);
      console.log("dispatched_quantity:", dispatchedQty);
      console.log("pending_quantity:", remainingQty);

      return orderData;
    }).filter(item => item.pending_qty > 0 && item.status !== "Completed");

    console.log("Active pending orders mapped:", activeItems);
    setOrders(activeItems);
  };

  const filteredOrders = orders.filter((item) => {
    const itemPlantNum = String(item.plant || "").replace(/\D/g, "");
    const selectedPlantNum = selectedPlant.replace(/\D/g, "");
    const plantMatch =
      selectedPlant === "All" || itemPlantNum === selectedPlantNum;

    const poMatch = (item.po_number || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const compMatch = (item.component || "")
      .toLowerCase()
      .includes(compSearch.toLowerCase());

    return plantMatch && poMatch && compMatch;
  });

  const columns = [
    { header: "Component Name", key: "component" },
    {
      header: "Plant",
      render: (item) => `Plant ${String(item.plant || "").replace(/plant/i, "").trim()}`
    },
    {
      header: "Ordered Qty",
      render: (item) => Number(item.ordered_qty || 0).toLocaleString()
    },
    {
      header: "Pending Qty",
      render: (item) => (
        <span style={{ fontWeight: 700 }}>
          {Number(item.pending_qty || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />
    },
    {
      header: "Action",
      render: (item) => (
        <FormButton
          variant="secondary"
          onClick={() => navigate(`/history/${encodeURIComponent(item.component)}`)}
          style={{ padding: "6px 12.5px", fontSize: "12.5px" }}
        >
          Dispatch
        </FormButton>
      )
    }
  ];

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <FadeContent blur={true} duration={800} initialOpacity={0}>
          <PageHeader
            title="Pending Orders"
            subtitle="Live pending production orders aggregated from catalog."
          />

          <GlassCard style={{ marginBottom: "25px", padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ width: "180px" }}>
                <FormSelect
                  label="Select Plant"
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  style={{ marginBottom: 0 }}
                >
                  <option value="All">All Plants</option>
                  <option value="2">Plant 2</option>
                  <option value="3">Plant 3</option>
                  <option value="5">Plant 5</option>
                  <option value="7">Plant 7</option>
                </FormSelect>
              </div>
              <div style={{ width: "220px" }}>
                <FormInput
                  label="Search PO Number"
                  placeholder="Type PO number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "250px" }}>
                <FormInput
                  label="Filter Component Name"
                  placeholder="Type component name..."
                  value={compSearch}
                  onChange={(e) => setCompSearch(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>
          </GlassCard>

          <DataTable
            columns={columns}
            data={filteredOrders}
            isLoading={isLoading}
            emptyMessage="No pending orders found."
          />
        </FadeContent>
      </div>
    </div>
  );
}

export default PendingOrders;