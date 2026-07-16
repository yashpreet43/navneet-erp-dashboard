import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/common/PageHeader";
import FadeContent from "../components/animations/FadeContent";
import GlassCard from "../components/common/GlassCard";
import { FormInput, FormSelect } from "../components/common/FormComponents";
import ComponentList from "../components/ComponentList";
import ComponentDetail from "../components/ComponentDetail";

import "../styles/components.css";
import "../styles/pages.css";

import { supabase } from "../supabaseClient";

function PlasticComponents() {
  const [components, setComponents] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState("All");
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: componentData } = await supabase
      .from("component_catalog")
      .select("*");
    setComponents(componentData || []);
  }

  const filteredItems = components.filter((item) => {
    const plantMatch =
      selectedPlant === "All" ||
      String(item.plant).toLowerCase() === selectedPlant.toLowerCase();

    const searchMatch = item.component_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    return plantMatch && searchMatch;
  });

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <FadeContent blur={true} duration={800} initialOpacity={0}>
          <PageHeader
            title="Components"
            subtitle="View and analyze factory component specifications and profit margins."
          />

          <GlassCard style={{ marginBottom: "25px", padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: "250px" }}>
                <FormInput
                  label="Search Components"
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
                  <option value="plant 1">Plant 1</option>
                  <option value="plant 2">Plant 2</option>
                  <option value="plant 3">Plant 3</option>
                  <option value="plant 5">Plant 5</option>
                  <option value="plant 7">Plant 7</option>
                </FormSelect>
              </div>
            </div>
          </GlassCard>

          <div className="plastic-main-content" style={{ padding: 0 }}>
            <ComponentList
              items={filteredItems}
              setSelectedComponent={setSelectedComponent}
            />

            <ComponentDetail component={selectedComponent} />
          </div>
        </FadeContent>
      </div>
    </div>
  );
}

export default PlasticComponents;