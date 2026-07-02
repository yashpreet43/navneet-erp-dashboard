import { BrowserRouter, Routes, Route }
from "react-router-dom";

import Home from "./pages/Home";

import PlasticComponents
from "./pages/PlasticComponents";

import PriceList
from "./pages/PriceList";

import PendingOrders
from "./pages/PendingOrders";

import OrderHistory
from "./pages/OrderHistory";

import AddOrder
from "./pages/AddOrder";

import "./styles/global.css";
import "./styles/sidebar.css";
import "./styles/home.css";
import "./styles/forms.css";
import "./styles/tables.css";

import Expenses from "./pages/Expenses";
import AddExpense from "./pages/AddExpense";

import Employees from "./pages/Employees";

import Vendors from "./pages/Vendors";


function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

       
        <Route
          path="/plastic-components"
          element={<PlasticComponents />}
        />

        <Route
          path="/price-list"
          element={<PriceList />}
        />

<Route
  path="/pending-orders"
  element={<PendingOrders />}
/>

<Route
  path="/history/:component"
  element={<OrderHistory />}
/>

<Route
    path="/expenses"
    element={<Expenses />}
/>

<Route
    path="/add-expense"
    element={<AddExpense />}
/>

<Route
    path="/employees"
    element={<Employees />}
/>

<Route
    path="/vendors"
    element={<Vendors />}
/>

<Route
  path="/add-order"
  element={<AddOrder />}
/>
      </Routes>

    </BrowserRouter>
  );
}

export default App;