import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/common/PageHeader";
import FadeContent from "../components/animations/FadeContent";
import GlassCard from "../components/common/GlassCard";
import DataTable from "../components/common/DataTable";
import KPICard from "../components/common/KPICard";
import StatusBadge from "../components/common/StatusBadge";
import { FormInput, FormSelect, FormDatePicker, FormButton } from "../components/common/FormComponents";
import { supabase } from "../supabaseClient";
import componentsData from "../data/componentsData.json";

function OrderHistory() {
  const { component } = useParams();
  const componentName = decodeURIComponent(component);

  const [selectedPO, setSelectedPO] = useState("");
  const [orders, setOrders] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [dispatchDate, setDispatchDate] = useState("");
  const [dispatchQty, setDispatchQty] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();

    // Subscribe to dispatches and purchase_order_items changes to auto-update
    const channel = supabase
      .channel("order_history_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dispatches" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "purchase_order_items" },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [component]);

  async function loadData() {
    setIsLoading(true);
    const { data: componentData, error: componentError } = await supabase
      .from("components")
      .select("id")
      .eq("component_name", componentName)
      .single();

    if (componentError || !componentData) {
      console.log(componentError);
      setIsLoading(false);
      return;
    }

    const componentId = componentData.id;

    const { data: poItems, error: poError } = await supabase
      .from("purchase_order_items")
      .select(`
        id,
        ordered_qty,
        rate,
        purchase_order_id,
        purchase_orders (
          po_number,
          po_date,
          plant,
          companies (
            company_name
          )
        )
      `)
      .eq("component_id", componentId);

    if (poError) {
      console.log(poError);
      setIsLoading(false);
      return;
    }

    let poDocs = [];
    const poIds = poItems.map((item) => item.purchase_order_id).filter(Boolean);
    if (poIds.length > 0) {
      try {
        const { data: docs, error: docsError } = await supabase
          .from("po_documents")
          .select("*")
          .in("purchase_order_id", poIds);
        if (!docsError) {
          poDocs = docs || [];
        }
      } catch (err) {
        console.warn("po_documents fetch bypassed:", err);
      }
    }

    const itemIds = poItems.map((item) => item.id);

    if (itemIds.length === 0) {
      setOrders([]);
      setDispatches([]);
      setIsLoading(false);
      return;
    }

    const { data: dispatchData, error: dispatchError } = await supabase
      .from("dispatches")
      .select("*")
      .in("purchase_order_item_id", itemIds)
      .order("dispatch_date", { ascending: false });

    setIsLoading(false);
    if (dispatchError) {
      console.log(dispatchError);
      return;
    }

    const dispatchList = dispatchData || [];
    setDispatches(dispatchList);

    const catalogItem = componentsData.find(c => c.name?.toLowerCase() === componentName.toLowerCase());
    const fallbackPrice = catalogItem && catalogItem.price ? Number(catalogItem.price) : 5.0;

    const updatedOrders = poItems.map((item) => {
      const itemDispatches = dispatchList.filter((d) => d.purchase_order_item_id === item.id);
      const deliveredQty = itemDispatches.reduce((sum, d) => sum + Number(d.dispatched_qty || 0), 0);

      const pendingQty = Number(item.ordered_qty || 0) - deliveredQty;
      const completion =
        item.ordered_qty > 0
          ? Math.min(100, Math.round((deliveredQty / item.ordered_qty) * 100))
          : 0;

      let status = "Pending";
      if (deliveredQty === 0) {
        status = "Pending";
      } else if (deliveredQty > 0 && pendingQty > 0) {
        status = "In Production";
      } else if (pendingQty <= 0) {
        status = "Completed";
      }

      // Completion Date: date of the last dispatch if completed
      let completionDate = "N/A";
      if (status === "Completed" && itemDispatches.length > 0) {
        const dates = itemDispatches.map(d => new Date(d.dispatch_date));
        const maxDate = new Date(Math.max(...dates));
        completionDate = maxDate.toLocaleDateString("en-CA");
      }

      // Total Order Value
      const rate = Number(item.rate || 0) > 0 ? Number(item.rate) : fallbackPrice;
      const totalOrderValue = item.ordered_qty * rate;

      // Dispatch Timeline: comma separated list of dates & quantities
      const sortedDispatches = [...itemDispatches].sort(
        (a, b) => new Date(a.dispatch_date) - new Date(b.dispatch_date)
      );
      const dispatchTimeline = sortedDispatches.length > 0
        ? sortedDispatches.map(d => `${d.dispatch_date} (${Number(d.dispatched_qty).toLocaleString()})`).join(", ")
        : "No dispatches yet";

      const doc = poDocs.find((d) => d.purchase_order_id === item.purchase_order_id);

      return {
        purchase_order_id: item.purchase_order_id,
        po_number: item.purchase_orders.po_number,
        po_date: item.purchase_orders.po_date,
        plant: item.purchase_orders.plant,
        ordered_qty: item.ordered_qty,
        dispatched_qty: deliveredQty,
        pending_qty: pendingQty,
        completion,
        status,
        completion_date: completionDate,
        total_value: totalOrderValue,
        dispatch_timeline: dispatchTimeline,
        po_document_url: doc ? doc.file_url : null,
        purchase_order_item_id: item.id
      };
    });

    setOrders(updatedOrders);
  }

  async function addDispatch() {
    if (!selectedPO || !dispatchDate || !dispatchQty) {
      alert("Enter date and quantity");
      return;
    }

    const order = orders.find(
      (o) => String(o.purchase_order_item_id) === selectedPO
    );

    if (Number(dispatchQty) > Number(order.pending_qty)) {
      alert("Dispatch quantity exceeds pending quantity");
      return;
    }

    const { error } = await supabase.from("dispatches").insert([
      {
        purchase_order_item_id: order.purchase_order_item_id,
        dispatch_date: dispatchDate,
        dispatched_qty: Number(dispatchQty)
      }
    ]);

    if (error) {
      console.log(error);
      alert("Error saving dispatch");
      return;
    }

    alert("Dispatch Added Successfully");
    setDispatchDate("");
    setDispatchQty("");
    setSelectedPO("");
    loadData();
  }

  const completedCount = orders.filter((o) => o.status === "Completed").length;
  const inProductionCount = orders.filter((o) => o.status === "In Production").length;
  const pendingCount = orders.filter((o) => o.status === "Pending").length;

  const poColumns = [
    { header: "PO Number", render: (item) => item.po_number || "Legacy Order" },
    { header: "Plant", key: "plant" },
    { header: "Ordered Quantity", render: (item) => Number(item.ordered_qty || 0).toLocaleString() },
    { header: "Pending Quantity", render: (item) => Number(item.pending_qty || 0).toLocaleString() },
    {
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />
    },
    { header: "Order Date", key: "po_date" },
    {
      header: "Actions",
      render: (item) =>
        item.po_document_url ? (
          <FormButton
            variant="secondary"
            onClick={() => window.open(item.po_document_url, "_blank")}
            style={{ padding: "6px 12.5px", fontSize: "12.5px" }}
          >
            📎 View PO
          </FormButton>
        ) : (
          <span style={{ fontSize: "12.5px", color: "#64748b" }}>Manual Entry</span>
        )
    }
  ];

  const dispatchColumns = [
    { header: "Date", key: "dispatch_date" },
    { header: "Delivered Qty", render: (item) => Number(item.dispatched_qty || 0).toLocaleString() }
  ];

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <FadeContent blur={true} duration={800} initialOpacity={0}>
          <PageHeader
            title={componentName}
            subtitle="Track pending purchase orders, dispatch history, and log dispatch dispatches."
          />

           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "25px" }}>
            <KPICard title="Completed" value={completedCount} statusColor="#10b981" />
            <KPICard title="In Production" value={inProductionCount} statusColor="#8b5cf6" />
            <KPICard title="Pending" value={pendingCount} statusColor="#3b82f6" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            <GlassCard title="Purchase Orders" subtitle="Purchase orders matching this component catalog specification.">
              <DataTable
                columns={poColumns}
                data={orders}
                isLoading={isLoading}
                emptyMessage="No purchase orders found for this component."
              />
            </GlassCard>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", alignItems: "start" }}>
              <GlassCard title="Dispatch History" subtitle="List of historic dispatch logs.">
                <DataTable
                  columns={dispatchColumns}
                  data={dispatches}
                  isLoading={isLoading}
                  emptyMessage="No dispatch records logged."
                />
              </GlassCard>

              <GlassCard title="Add Dispatch Entry" subtitle="Record a physical component dispatch delivery.">
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <FormSelect
                    label="Select PO Number"
                    value={selectedPO}
                    onChange={(e) => setSelectedPO(e.target.value)}
                  >
                    <option value="">Select PO Number</option>
                    {orders.map((order) => (
                      <option
                        key={order.po_number}
                        value={order.purchase_order_item_id}
                      >
                        {order.po_number}
                      </option>
                    ))}
                  </FormSelect>

                  <FormDatePicker
                    label="Dispatch Date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                  />

                  <FormInput
                    label="Dispatch Quantity"
                    type="number"
                    placeholder="Enter dispatch quantity"
                    value={dispatchQty}
                    onChange={(e) => setDispatchQty(e.target.value)}
                  />

                  <FormButton
                    variant="primary"
                    onClick={addDispatch}
                    style={{ marginTop: "10px", alignSelf: "flex-end" }}
                  >
                    Save Dispatch
                  </FormButton>
                </div>
              </GlassCard>
            </div>
          </div>
        </FadeContent>
      </div>
    </div>
  );
}

export default OrderHistory;