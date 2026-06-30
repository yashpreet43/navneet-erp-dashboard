import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <div className="sidebar">

      <h2 className="sidebar-logo">
        🏭 Navneet
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

      </div>

    </div>
  );
}

export default Sidebar;