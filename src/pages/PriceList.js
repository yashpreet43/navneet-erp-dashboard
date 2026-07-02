import { useState } from "react";

import Navbar from "../components/Navbar";

import componentsData from "../data/componentsData";

function PriceList() {

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedPlant, setSelectedPlant] =
    useState("All");

  const filteredItems = componentsData.filter(
    (item) => {

      const plantMatch =
  selectedPlant === "All" ||
  item.plant?.toLowerCase() ===
  selectedPlant.toLowerCase();

      const searchMatch =
        item.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      return plantMatch && searchMatch;
    }
  );

  return (

    <div>

      <Navbar />

      {/* PAGE HEADER */}

      <div className="price-page-header">

        <h1>Price List</h1>

        <p>
          Plant-wise component pricing
        </p>

      </div>

      {/* FILTER SECTION */}

      <div className="price-filters">

        {/* SEARCH */}

        <input
          type="text"
          placeholder="Search component..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
        />

        {/* PLANT FILTER */}

        <select
          value={selectedPlant}
          onChange={(e) =>
            setSelectedPlant(e.target.value)
          }
        >

          <option value="All">
            All Plants
          </option>

          <option value="Plant 1">
            Plant 1
          </option>

          <option value="Plant 2">
            Plant 2
          </option>

          <option value="Plant 3">
            Plant 3
          </option>

          <option value="Plant 5">
            Plant 5
          </option>

          <option value="Plant 7">
            Plant 7
          </option>

        </select>

      </div>

      {/* TABLE */}

      <div className="table-container">

        <table className="price-table">

          <thead>

            <tr>

              <th>Component Name</th>

              <th>Plant</th>

              <th>Price</th>

            </tr>

          </thead>

          <tbody>

            {filteredItems.map((item) => (

              <tr key={item.id}>

                <td>{item.name}</td>

                <td>{item.plant}</td>

                <td>

                  {item.price
                    ? `₹${item.price}`
                    : (
                      <span className="pending-price">
                        Price Pending
                      </span>
                    )}

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default PriceList;