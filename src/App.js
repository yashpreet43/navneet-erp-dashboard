import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import gsap from "gsap";
import FadeContent from "./components/animations/FadeContent";

import Home from "./pages/Home";
import PlasticComponents from "./pages/PlasticComponents";
import PriceList from "./pages/PriceList";
import PendingOrders from "./pages/PendingOrders";
import OrderHistory from "./pages/OrderHistory";
import AddOrder from "./pages/AddOrder";

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
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem("splashShown");
  });
  const splashRef = useRef(null);

  useEffect(() => {
    if (showSplash) {
      sessionStorage.setItem("splashShown", "true");

      const timer = setTimeout(() => {
        if (splashRef.current) {
          gsap.to(splashRef.current, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => setShowSplash(false)
          });
        } else {
          setShowSplash(false);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  return (
    <>
      {showSplash && (
        <div
          ref={splashRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "linear-gradient(135deg, #020617, #0f172a, #172554)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            color: "#f8fafc",
            fontFamily: "'Segoe UI', Roboto, sans-serif",
            textAlign: "center"
          }}
        >
          <FadeContent blur={true} duration={1500} initialOpacity={0} ease="power2.out">
            <h1 style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 10px 0", color: "#ffffff" }}>
              NAVNEET INDUSTRIES
            </h1>
            <p style={{ fontSize: "16px", color: "#3b82f6", fontWeight: 600, letterSpacing: "0.05em", margin: "0 0 20px 0" }}>
              Smart Manufacturing ERP
            </p>
            <div style={{ width: "60px", height: "2px", background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", margin: "0 auto 20px" }} />
            <p style={{ fontSize: "12px", color: "#cbd5e1", opacity: 0.7, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Manufacture • Analyze • Optimize
            </p>
          </FadeContent>
        </div>
      )}

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plastic-components" element={<PlasticComponents />} />
          <Route path="/price-list" element={<PriceList />} />
          <Route path="/pending-orders" element={<PendingOrders />} />
          <Route path="/history/:component" element={<OrderHistory />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/add-expense" element={<AddExpense />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/add-order" element={<AddOrder />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;