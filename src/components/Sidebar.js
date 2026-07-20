import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems = [
    { to: "/", label: "Dashboard", icon: "📊" },
    { to: "/plastic-components", label: "Components", icon: "🧩" },
    { to: "/pending-orders", label: "Pending Orders", icon: "⏳" },
    { to: "/add-order", label: "Add Order", icon: "➕" },
    { to: "/expenses", label: "Expenses", icon: "💸" },
    { to: "/add-expense", label: "Add Expense", icon: "💳" },
    { to: "/employees", label: "Employees", icon: "👥" },
    { to: "/vendors", label: "Vendors", icon: "🏬" },
  ];

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <header className="mobile-header">
        <button
          className="hamburger-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
        </button>
        <div className="mobile-logo">
          <span>🏭</span> Navneet
        </div>
      </header>

      {/* Semi-transparent Backdrop for Mobile Drawer */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Responsive Sidebar */}
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-logo">
          <span className="logo-icon">🏭</span>
          <span className="logo-text">Navneet</span>
        </div>

        <nav className="sidebar-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-tooltip={item.label}
              onClick={() => setMobileOpen(false)}
            >
              <span className="link-icon">{item.icon}</span>
              <span className="link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;