import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../supabaseClient";

import Sidebar from "../components/Sidebar";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from "recharts";

function Home() {

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

  /* ===================
      ANALYTICS
  =================== */

  const totalRevenue =
    purchaseOrders.reduce(
      (sum, item) =>
        sum +
        Number(item.ordered_qty || 0) *
        Number(item.rate || 0),
      0
    );

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

  const totalPlants =
    [...new Set(
      components.map(
        item => item.plant
      )
    )].length;

  const revenueMap = {};

  purchaseOrders.forEach(item => {

    const revenue =
      Number(item.ordered_qty || 0) *
      Number(item.rate || 0);

    revenueMap[item.component_id] =
      (revenueMap[item.component_id] || 0)
      + revenue;
  });

  const topComponentId =
    Object.keys(revenueMap).length > 0
      ? Object.keys(revenueMap)
          .reduce(
            (a, b) =>
              revenueMap[a] >
              revenueMap[b]
                ? a
                : b
          )
      : null;

  const topRevenueComponent =
    components.find(
      component =>
        Number(component.id) ===
        Number(topComponentId)
    );

    const chartData = [
  {
    name: "Revenue",
    value: Math.round(totalRevenue)
  },
  {
    name: "Components",
    value: components.length
  },
  {
    name: "Profit",
    value: averageProfit * 100
  },
  {
    name: "Plants",
    value: totalPlants * 1000
  }
];

const machineCapacity = [
  {
    machine: "15 gm",
    capacity: 6480
  },
  {
    machine: "50 gm",
    capacity: 3240
  },
  {
    machine: "100 gm",
    capacity: 4050
  },
  {
    machine: "200 gm",
    capacity: 720
  }
];

const shiftData = [
  {
    name: "Production",
    value: 9
  },
  {
    name: "Downtime",
    value: 2
  },
  {
    name: "Die Change",
    value: 1
  }
];

const highestProfit =
  components.reduce(
    (max, item) =>
      Number(item.profit || 0) >
      Number(max.profit || 0)
        ? item
        : max,
    components[0] || {}
  );

const lowestProfit =
  components.reduce(
    (min, item) =>
      Number(item.profit || 0) <
      Number(min.profit || 99999)
        ? item
        : min,
    components[0] || {}
  );

const avgProfit =
  components.length > 0
    ? (
        components.reduce(
          (sum, item) =>
            sum +
            Number(item.profit || 0),
          0
        ) / components.length
      ).toFixed(2)
    : 0;

const profitData =
  [...components]
    .sort(
      (a, b) =>
        Number(b.profit || 0) -
        Number(a.profit || 0)
    )
    .slice(0, 5)
    .map(item => ({
      name:
        item.component_name,
      profit:
        Number(item.profit || 0)
    }));

const plantProfit = {};

components.forEach(component => {

  const plant =
    component.plant || "Unknown";

  const profit =
    Number(component.profit || 0);

  plantProfit[plant] =
    (plantProfit[plant] || 0)
    + profit;
});

const plantProfitData =
  Object.keys(plantProfit).map(
    plant => ({
      plant,
      profit:
        Math.round(
          plantProfit[plant]
        )
    })
  );

  const expenseData = [
    { name: "Raw Material", value: 500000 },
    { name: "Labour", value: 275000 },
    { name: "GST", value: 220000 },
    { name: "Electricity", value: 85000 },
    { name: "Others", value: 125000 }
];

const workforceData = [
    {
        name: "Operators",
        value: 5
    },
    {
        name: "Contractors",
        value: 2
    },
    {
        name: "Management",
        value: 2
    },
    {
        name: "Technical",
        value: 1
    }
];

  return (

<div className="layout">

<Sidebar />

<div className="main-content">
      

<div className="dashboard-header">
    <h1>
        Manufacturing Intelligence Dashboard
    </h1>

    <p>
        Real-time production, profitability and operations analytics
    </p>
</div>

<section className="dashboard-card">

    <h2>Overview</h2>

    <div className="stats-grid">

        <div className="stat-card">
            <h3>₹{Math.round(totalRevenue)}</h3>
            <p>Revenue</p>
        </div>

        <div className="stat-card">
            <h3>{components.length}</h3>
            <p>Components</p>
        </div>

        <div className="stat-card">
            <h3>{totalPlants}</h3>
            <p>Plants</p>
        </div>

        <div className="stat-card">
            <h3>₹{averageProfit}</h3>
            <p>Avg Profit</p>
        </div>

    </div>

</section>


<div className="dashboard-columns">

    <div className="left-column">

        <section className="dashboard-card">

        <h2>Machine Productivity</h2>

        <div className="machine-stats">

            <div className="stat-card">
                <h3>8</h3>
                <p>Machines</p>
            </div>

            <div className="stat-card">
                <h3>75%</h3>
                <p>Utilization</p>
            </div>

            <div className="stat-card">
                <h3>9 hrs</h3>
                <p>Productive Time</p>
            </div>

            <div className="stat-card">
                <h3>14,490</h3>
                <p>Capacity</p>
            </div>

        </div>

        <ResponsiveContainer width="100%" height={350}>
            <PieChart>
                <Pie
                    data={shiftData}
                    dataKey="value"
                    outerRadius={100}
                    label
                >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10b981" />
                </Pie>

                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>

    </section>
</div>

     <div className="right-column">

        <section className="dashboard-card">

        <h2>Machine Capacity</h2>

        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={machineCapacity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="machine" />
                <YAxis />
                <Tooltip />

                <Bar
                    dataKey="capacity"
                    fill="#3b82f6"
                    radius={[8,8,0,0]}
                    animationDuration={1500}
                />
            </BarChart>
        </ResponsiveContainer>

        <div className="table-container">

            <table>

                <thead>
                    <tr>
                        <th>Machine</th>
                        <th>Count</th>
                        <th>Cycle</th>
                        <th>Capacity</th>
                    </tr>
                </thead>

                <tbody>

                    <tr>
                        <td>15 gm</td>
                        <td>2</td>
                        <td>10 sec</td>
                        <td>6480</td>
                    </tr>

                    <tr>
                        <td>50 gm</td>
                        <td>2</td>
                        <td>20 sec</td>
                        <td>3240</td>
                    </tr>

                    <tr>
                        <td>100 gm</td>
                        <td>3</td>
                        <td>24 sec</td>
                        <td>4050</td>
                    </tr>

                    <tr>
                        <td>200 gm</td>
                        <td>1</td>
                        <td>45 sec</td>
                        <td>720</td>
                    </tr>

                </tbody>

            </table>

        </div>

    </section>

</div>
</div>
<div className="stats-grid">

    <div className="stat-card">
        <h3>₹12.05L</h3>
        <p>Total Expenses</p>
    </div>

    <div className="stat-card">
        <h3>₹7.20L</h3>
        <p>Pending Payments</p>
    </div>

    <div className="stat-card">
        <h3>₹4.85L</h3>
        <p>Paid Expenses</p>
    </div>

    <div className="stat-card">
        <h3>11</h3>
        <p>Workforce</p>
    </div>

</div>
<section className="dashboard-card">
    <h2>Expense Distribution</h2>
    <ResponsiveContainer width="100%" height={300}>
        <PieChart>

            <Pie
                data={expenseData}
                dataKey="value"
                outerRadius={100}
                label
            >

                <Cell fill="#3b82f6" />
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
                <Cell fill="#8b5cf6" />

            </Pie>

            <Tooltip />
            <Legend />

        </PieChart>
    </ResponsiveContainer>
</section>

<div className="insight warning">
    Raw material contributes 41% of total expenses.
</div>

<div className="insight info">
    Labour accounts for 23% of monthly expenditure.
</div>

<div className="insight success">
    Electricity remains below 10% of operating costs.
</div>


<div className="dashboard-card">

    <h2>
        Scrap Recovery Analysis
    </h2>

    <div className="stat-card">
        <h3>10%</h3>
        <p>Current Scrap</p>
    </div>

    <div className="stat-card">
        <h3>₹70K</h3>
        <p>Monthly Savings</p>
    </div>

    <div className="stat-card">
        <h3>₹8L</h3>
        <p>Annual Savings</p>
    </div>

</div>


<div className="dashboard-columns">

    <div className="left-column">

        <section className="dashboard-card">


        <h2>Factory Insights</h2>

        <div className="insight info">
            Machine utilization is 75%.
        </div>

        <div className="insight warning">
            25% shift time is lost.
        </div>

        <div className="insight warning">
            200 gm machine is the bottleneck.
        </div>

        <div className="insight success">
            Reduce die change time to increase production.
        </div>

    </section>
    </div>


   <div className="right-column">

        <section className="dashboard-card">

        <h2>Profit Intelligence</h2>

        <div className="profit-stats">

            <div className="stat-card">
                <h3>₹{highestProfit?.profit || 0}</h3>
                <p>Highest Profit</p>
            </div>

            <div className="stat-card">
                <h3>₹{lowestProfit?.profit || 0}</h3>
                <p>Lowest Profit</p>
            </div>

            <div className="stat-card">
                <h3>₹{averageProfit}</h3>
                <p>Average Profit</p>
            </div>

            <div className="stat-card">
                <h3>
                    {topRevenueComponent?.component_name || "No Data"}
                </h3>
                <p>Best Component</p>
            </div>

        </div>

    </section>

    <div className="dashboard-columns">

    <div className="left-column">

        <section className="dashboard-card">

            <h2>Labour Analysis</h2>

            <div className="stats-grid">

                <div className="stat-card">
                    <h3>11</h3>
                    <p>Total Workforce</p>
                </div>

                <div className="stat-card">
                    <h3>9</h3>
                    <p>Employees</p>
                </div>

                <div className="stat-card">
                    <h3>2</h3>
                    <p>Contractors</p>
                </div>

                <div className="stat-card">
                    <h3>₹2.86L</h3>
                    <p>Monthly Labour</p>
                </div>

            </div>

            <div className="insight info">
                Operators contribute the majority of the workforce.
            </div>

            <div className="insight success">
                Labour costs account for approximately 23% of monthly expenses.
            </div>

        </section>

    </div>

    <div className="right-column">

        <section className="dashboard-card">

            <h2>Workforce Distribution</h2>

            <ResponsiveContainer width="100%" height={300}>

                <PieChart>

                    <Pie
                       data={workforceData}
                        dataKey="value"
                        outerRadius={100}
                        label
                    >

                        <Cell fill="#3b82f6" />
            <Cell fill="#10b981" />
            <Cell fill="#f59e0b" />
            <Cell fill="#ef4444" />

                    </Pie>

                    <Tooltip />
                    <Legend />

                </PieChart>

            </ResponsiveContainer>

        </section>

    </div>

</div>

<div className="dashboard-columns">

    <div className="left-column">

        <section className="dashboard-card">

            <h2>Vendor Analysis</h2>

            <div className="stats-grid">

                <div className="stat-card">
                    <h3>5</h3>
                    <p>Suppliers</p>
                </div>

                <div className="stat-card">
                    <h3>9.5T</h3>
                    <p>Material</p>
                </div>

                <div className="stat-card">
                    <h3>₹52</h3>
                    <p>Avg Rate</p>
                </div>

                <div className="stat-card">
                    <h3>ASG</h3>
                    <p>Top Supplier</p>
                </div>

            </div>

        </section>

    </div>

    <div className="right-column">

        <section className="dashboard-card">

            <h2>Raw Material Insights</h2>

            <div className="insight success">
                ASG Minerals supplies the highest quantity.
            </div>

            <div className="insight warning">
                Pragati Enterprises has the highest procurement cost.
            </div>

            <div className="insight success">
                Scrap recycling can reduce material costs by 10–15%.
            </div>

        </section>

    </div>

</div>

</div>
</div>


<div className="dashboard-columns">

    <div className="left-column">

        <section className="dashboard-card">

        <h2>Top Components</h2>

        <ResponsiveContainer width="100%" height={350}>

            <BarChart data={profitData} layout="vertical">

                <XAxis type="number" />

                <YAxis
                    type="category"
                    dataKey="name"
                />

                <Tooltip />

                <Bar
                    dataKey="profit"
                    fill="#3b82f6"
                    radius={[0,8,8,0]}
                    animationDuration={1500}
                />

            </BarChart>

        </ResponsiveContainer>

    </section>
</div>

   <div className="right-column">

        <section className="dashboard-card">

        <h2>Plant Profit</h2>

        <ResponsiveContainer width="100%" height={350}>

            <BarChart data={plantProfitData}>

                <XAxis dataKey="plant" />

                <YAxis />

                <Tooltip />

                <Bar
                    dataKey="profit"
                    fill="#10b981"
                    radius={[8,8,0,0]}
                    animationDuration={1500}
                />

            </BarChart>

        </ResponsiveContainer>

    </section>

</div>
</div>

<section className="dashboard-card">

    <h2>Business Operations</h2>

    <div className="operations-grid">

        <div className="operation-card">

            <h3>Pending Orders</h3>

            <p>
                Track pending quantities and balances.
            </p>

            <Link
                to="/pending-orders"
                className="dashboard-btn"
            >
                View Orders
            </Link>

        </div>

        <div className="operation-card">

            <h3>Add Purchase Order</h3>

            <p>
                Enter customer orders into ERP.
            </p>

            <Link
                to="/add-order"
                className="dashboard-btn"
            >
                Add Order
            </Link>

        </div>

    </div>

</section>

    </div>
</div>
  );
}

export default Home;