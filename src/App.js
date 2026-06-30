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

import "./styles/navbar.css";

//import "./styles/main.css";

import "./styles/animations.css";

import "./styles/components.css";

import "./styles/forms.css";

import "./styles/tables.css";

import "./styles/pages.css";
import "./styles/animations.css";
import "./styles/responsive.css";

import "./styles/sidebar.css";

import Expenses from "./pages/Expenses";
import AddExpense from "./pages/AddExpense";

import Employees from "./pages/Employees";

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
  path="/add-order"
  element={<AddOrder />}
/>
      </Routes>

    </BrowserRouter>
  );
}

export default App;