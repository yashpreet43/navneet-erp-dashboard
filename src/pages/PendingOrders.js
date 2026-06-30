import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient";

function PendingOrders() {

  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [selectedPlant, setSelectedPlant] =
    useState("All");

  const [searchTerm, setSearchTerm] =
    useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {

    const { data, error } =
      await supabase
        .from("pending_summary_live")
        .select("*");

    if (error) {
      console.log(error);
      return;
    }

    setOrders(data || []);
  };

  const filteredOrders =
    orders.filter((item) => {

      const plantMatch =
        selectedPlant === "All" ||
        String(item.plant) === selectedPlant;

      const searchMatch =
        (item.component || "")
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          );

      return (
        plantMatch &&
        searchMatch
      );
    });

  return (

    <div>

      <Navbar />

      <div className="pending-page">

        <h1>
          Pending Orders
        </h1>

        <p className="pending-subtitle">
          Live Pending Orders From Database
        </p>

        <div className="pending-filters">

          <select
            value={selectedPlant}
            onChange={(e) =>
              setSelectedPlant(
                e.target.value
              )
            }
          >

            <option value="All">
              All Plants
            </option>

            <option value="2">
              Plant 2
            </option>

            <option value="3">
              Plant 3
            </option>

            <option value="5">
              Plant 5
            </option>

            <option value="7">
              Plant 7
            </option>

          </select>

          <input
            type="text"
            placeholder="Search Component..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
          />

        </div>

        <p>
          Rows Found:
          {" "}
          {filteredOrders.length}
        </p>

        <div className="pending-table-wrapper">

          <table className="pending-modern-table">

            <thead>

              <tr>
                <th>Component</th>
                <th>Plant</th>
                <th>Pending Qty</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              {filteredOrders.map(
                (item, index) => (

                <tr key={index}>

                  <td className="component-cell">
                    {item.component}
                  </td>

                  <td>
                    Plant {item.plant}
                  </td>

                  <td className="pending-value">
                    {item.pending_qty}
                  </td>

                  <td>

                    <button
                      onClick={() =>
                        navigate(
                          `/history/${encodeURIComponent(
                            item.component
                          )}`
                        )
                      }
                    >

                      View History

                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );
}

export default PendingOrders;