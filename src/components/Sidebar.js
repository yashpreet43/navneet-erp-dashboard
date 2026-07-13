import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <div className="sidebar">

      <h2 className="sidebar-logo">
        🏭 Navneet Industries
      </h2>

      <div className="sidebar-links">

        <NavLink to="/">
          Dashboard
        </NavLink>

        <NavLink to="/plastic-components">
          Components
        </NavLink>

        <NavLink to="/pending-orders">
          Pending Orders
        </NavLink>

        <NavLink to="/add-order">
          Add Order
        </NavLink>

        <NavLink to="/expenses">
    Expenses
</NavLink>

<NavLink to="/add-expense">
    Add Expense
</NavLink>

<NavLink to="/employees">
    Employees
</NavLink>

<NavLink to="/vendors">
    Vendors
</NavLink>

      </div>

    </div>
  );
}

export default Sidebar;