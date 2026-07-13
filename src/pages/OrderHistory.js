import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient";

function OrderHistory() {

  const { component } = useParams();

  const [selectedPO, setSelectedPO] =
    useState("");

  const [orders, setOrders] =
    useState([]);

  const [dispatches, setDispatches] =
    useState([]);

  const [dispatchDate, setDispatchDate] =
    useState("");

  const [dispatchQty, setDispatchQty] =
    useState("");

  useEffect(() => {
    loadData();
  }, [component]);

  async function loadData() {

    const componentName =
      decodeURIComponent(component);

    const {
      data: componentData,
      error: componentError
    } = await supabase
      .from("components")
      .select("id")
      .eq(
        "component_name",
        componentName
      )
      .single();

    if (
      componentError ||
      !componentData
    ) {
      console.log(componentError);
      return;
    }

    const componentId =
      componentData.id;

    const {
      data: poItems,
      error: poError
    } = await supabase
      .from("purchase_order_items")
      .select(`
        id,
        ordered_qty,
        rate,
        purchase_order_id,
        purchase_orders (
          po_number,
          po_date,
          plant
        )
      `)
      .eq("component_id", componentId);

    if (poError) {
      console.log(poError);
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

    const itemIds =
      poItems.map(
        (item) => item.id
      );

    if (
      itemIds.length === 0
    ) {
      setOrders([]);
      setDispatches([]);
      return;
    }

    const {
      data: dispatchData,
      error: dispatchError
    } = await supabase
      .from("dispatches")
      .select("*")
      .in(
        "purchase_order_item_id",
        itemIds
      )
      .order(
        "dispatch_date",
        {
          ascending: false
        }
      );

    if (dispatchError) {
      console.log(dispatchError);
      return;
    }

    const dispatchList =
      dispatchData || [];

    setDispatches(
      dispatchList
    );

    const updatedOrders =
      poItems.map((item) => {

        const deliveredQty =
          dispatchList
            .filter(
              (d) =>
                d.purchase_order_item_id ===
                item.id
            )
            .reduce(
              (sum, d) =>
                sum +
                Number(
                  d.dispatched_qty
                ),
              0
            );

        const pendingQty =
          item.ordered_qty -
          deliveredQty;

        const completion =
          item.ordered_qty > 0
            ? Math.round(
                (deliveredQty /
                  item.ordered_qty) * 100
              )
            : 0;

        let status = "";

        if (completion === 100) {
          status = "Completed";
        }
        else if (
          completion >= 70
        ) {
          status =
            "Nearly Complete";
        }
        else {
          status =
            "In Progress";
        }

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
          po_document_url: doc ? doc.file_url : null,
          purchase_order_item_id: item.id
        };
      });

    setOrders(
      updatedOrders
    );
  }

  async function addDispatch() {

    if (
      !selectedPO ||
      !dispatchDate ||
      !dispatchQty
    ) {

      alert(
        "Enter date and quantity"
      );

      return;
    }

    const order =
      orders.find(
        (o) =>
          String(
            o.purchase_order_item_id
          ) === selectedPO
      );

    if (
      Number(dispatchQty) >
      Number(order.pending_qty)
    ) {

      alert(
        "Dispatch quantity exceeds pending quantity"
      );

      return;
    }

    const { error } =
      await supabase
        .from("dispatches")
        .insert([
          {
            purchase_order_item_id:
              order.purchase_order_item_id,

            dispatch_date:
              dispatchDate,

            dispatched_qty:
              Number(dispatchQty)
          }
        ]);

    if (error) {

      console.log(error);

      alert(
        "Error saving dispatch"
      );

      return;
    }

    alert(
      "Dispatch Added Successfully"
    );

    setDispatchDate("");
    setDispatchQty("");
    setSelectedPO("");

    loadData();
  }

  const completedCount =
    orders.filter(
      o =>
        o.status ===
        "Completed"
    ).length;

  const nearCount =
    orders.filter(
      o =>
        o.status ===
        "Nearly Complete"
    ).length;

  const progressCount =
    orders.filter(
      o =>
        o.status ===
        "In Progress"
    ).length;

  return (

    <div>

      <Navbar />

      <div className="history-page">

        <h1>
          {decodeURIComponent(
            component
          )}
        </h1>

        <div className="machine-stats">

          <div className="machine-box">
            <h3>
              {completedCount}
            </h3>
            <p>Completed</p>
          </div>

          <div className="machine-box">
            <h3>
              {nearCount}
            </h3>
            <p>Nearly Complete</p>
          </div>

          <div className="machine-box">
            <h3>
              {progressCount}
            </h3>
            <p>In Progress</p>
          </div>

        </div>

        <div className="purchase-orders-table">

          <h2>
            Purchase Orders
          </h2>

          <div className="table-container">
            <table className="history-table">

            <thead>

              <tr>
                <th>PO Number</th>
                <th>Date</th>
                <th>Ordered</th>
                <th>Delivered</th>
                <th>Pending</th>
                <th>Plant</th>
                <th>Completion</th>
                <th>Status</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              {orders.map(
                (order, index) => (

                <tr key={index}>

                  <td>
                    {order.po_number}
                  </td>

                  <td>
                    {order.po_date}
                  </td>

                  <td>
                    {order.ordered_qty}
                  </td>

                  <td>
                    {order.dispatched_qty}
                  </td>

                  <td>
                    {order.pending_qty}
                  </td>

                  <td>
                    {order.plant}
                  </td>

                  <td>

                    <div className="progress-bar">

                      <div
                        className="progress-fill"
                        style={{
                          width:
                            `${order.completion}%`
                        }}
                      />

                    </div>

                    {order.completion}%

                  </td>

                  <td>

                    <span
                      className={`status-badge ${order.status
                        .toLowerCase()
                        .replace(
                          " ",
                          "-"
                        )}`}
                    >

                      {order.status}

                    </span>

                  </td>

                  <td>
                    {order.po_document_url ? (
                      <a
                        href={order.po_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dashboard-btn"
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          textDecoration: "none",
                          background: "rgba(255, 255, 255, 0.08) !important",
                          margin: 0,
                          display: "inline-block"
                        }}
                      >
                        📎 View PO
                      </a>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>Manual</span>
                    )}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>
          </div>

        </div>

        <div className="dispatch-history-table">

          <h2>
            Dispatch History
          </h2>

          <div className="table-container">
            <table className="history-table">

            <thead>

              <tr>
                <th>Date</th>
                <th>Delivered Qty</th>
              </tr>

            </thead>

            <tbody>

              {dispatches.map(
                (dispatch) => (

                <tr
                  key={
                    dispatch.id
                  }
                >

                  <td>
                    {
                      dispatch.dispatch_date
                    }
                  </td>

                  <td>
                    {
                      dispatch.dispatched_qty
                    }
                  </td>

                </tr>

              ))}

            </tbody>

          </table>
          </div>

        </div>

        <div className="dispatch-form">

          <h2>
            Add Dispatch Entry
          </h2>

          <select
            value={selectedPO}
            onChange={(e) =>
              setSelectedPO(
                e.target.value
              )
            }
          >

            <option value="">
              Select PO Number
            </option>

            {orders.map(
              (order) => (

              <option
                key={
                  order.po_number
                }
                value={
                  order.purchase_order_item_id
                }
              >

                {
                  order.po_number
                }

              </option>

            ))}

          </select>

          <input
            type="date"
            value={dispatchDate}
            onChange={(e) =>
              setDispatchDate(
                e.target.value
              )
            }
          />

          <input
            type="number"
            placeholder="Dispatch Quantity"
            value={dispatchQty}
            onChange={(e) =>
              setDispatchQty(
                e.target.value
              )
            }
          />

          <button
            onClick={
              addDispatch
            }
          >
            Save Dispatch
          </button>

        </div>

      </div>

    </div>
  );
}

export default OrderHistory;