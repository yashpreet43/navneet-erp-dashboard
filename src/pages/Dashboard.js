import { useState, useEffect } from "react";

import Navbar from "../components/Navbar";

import { supabase } from "../supabaseClient";

function Dashboard() {

  const [components, setComponents] =
    useState([]);

  const [purchaseOrders,
    setPurchaseOrders] =
    useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {

    const { data: componentData } =
      await supabase
        .from("component_catalog")
        .select("*");

    const { data: poData } =
      await supabase
        .from("purchase_order_items")
        .select("*");

    setComponents(
      componentData || []
    );

    setPurchaseOrders(
      poData || []
    );
  }

  const totalRevenue =
    purchaseOrders.reduce(
      (sum, item) =>
        sum +
        Number(item.ordered_qty || 0) *
        Number(item.rate || 0),
      0
    );

  const highestProfit =
    components.length > 0
      ? [...components].sort(
          (a, b) =>
            Number(b.profit || 0) -
            Number(a.profit || 0)
        )[0]
      : null;

  const totalPlants =
    [...new Set(
      components.map(
        c => c.plant
      )
    )].length;

  const averageProfit =
    components.length > 0
      ? Math.round(
          components.reduce(
            (sum, item) =>
              sum +
              Number(item.profit || 0),
            0
          ) /
          components.length
        )
      : 0;

  return (

    <div className="app">

      <Navbar />

      <div className="dashboard-page">

        <div className="dashboard-hero">

          <h1>
            Navneet Analytics Dashboard
          </h1>

          <p>
            Manufacturing Intelligence
            System
          </p>

        </div>

        <div className="dashboard-cards">

          <div className="dashboard-card">
            <h2>
              ₹{Math.round(totalRevenue)}
            </h2>
            <p>Total Revenue</p>
          </div>

          <div className="dashboard-card">
            <h2>
              {components.length}
            </h2>
            <p>Components</p>
          </div>

          <div className="dashboard-card">
            <h2>
              {totalPlants}
            </h2>
            <p>Plants</p>
          </div>

          <div className="dashboard-card">
            <h2>
              ₹{averageProfit}
            </h2>
            <p>Average Profit</p>
          </div>

        </div>

        <div className="dashboard-section">

          <h2>
            Highest Profit Component
          </h2>

          <div className="section-card">

            <h3>
              {
                highestProfit
                  ?.component_name
              }
            </h3>

            <h1>
              ₹{
                highestProfit
                  ?.profit
              }
            </h1>

          </div>

        </div>

        <div className="quick-actions">

          <button>
            Components
          </button>

          <button>
            Price List
          </button>

          <button>
            Pending Orders
          </button>

          <button>
            Dispatches
          </button>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;