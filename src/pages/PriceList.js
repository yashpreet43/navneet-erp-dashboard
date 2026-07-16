import { useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/common/PageHeader";
import FadeContent from "../components/animations/FadeContent";
import GlassCard from "../components/common/GlassCard";
import DataTable from "../components/common/DataTable";
import { FormInput, FormSelect } from "../components/common/FormComponents";
import componentsData from "../data/componentsData";

function PriceList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlant, setSelectedPlant] = useState("All");

  const filteredItems = componentsData.filter((item) => {
    const plantMatch =
      selectedPlant === "All" ||
      item.plant?.toLowerCase() === selectedPlant.toLowerCase();

    const searchMatch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return plantMatch && searchMatch;
  });

  const columns = [
    { header: "Component Name", key: "name" },
    { header: "Plant", key: "plant" },
    {
      header: "Price",
      render: (item) =>
        item.price ? (
          <span style={{ fontWeight: 600, color: "#10b981" }}>₹{item.price}</span>
        ) : (
          <span style={{ color: "#ef4444", fontStyle: "italic" }}>Price Pending</span>
        )
    }
  ];

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <FadeContent blur={true} duration={800} initialOpacity={0}>
          <PageHeader
            title="Price List"
            subtitle="Plant-wise component pricing catalog and lookup table."
          />

          <GlassCard style={{ marginBottom: "25px", padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: "250px" }}>
                <FormInput
                  label="Search Component"
                  placeholder="Type component name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div style={{ width: "200px" }}>
                <FormSelect
                  label="Select Plant"
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  style={{ marginBottom: 0 }}
                >
                  <option value="All">All Plants</option>
                  <option value="Plant 1">Plant 1</option>
                  <option value="Plant 2">Plant 2</option>
                  <option value="Plant 3">Plant 3</option>
                  <option value="Plant 5">Plant 5</option>
                  <option value="Plant 7">Plant 7</option>
                </FormSelect>
              </div>
            </div>
          </GlassCard>

          <DataTable
            columns={columns}
            data={filteredItems}
            emptyMessage="No components found matching your search."
          />
        </FadeContent>
      </div>
    </div>
  );
}

export default PriceList;