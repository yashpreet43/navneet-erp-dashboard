import { useState, useEffect } from "react";

import ComponentList from "../components/ComponentList";
import ComponentDetail from "../components/ComponentDetail";
import Navbar from "../components/Navbar";

import "../styles/components.css";
import "../styles/pages.css";

import { supabase } from "../supabaseClient";

function PlasticComponents() {

  const [components, setComponents] =
    useState([]);

  

  const [selectedPlant,
    setSelectedPlant] =
    useState("All");

  const [selectedComponent,
    setSelectedComponent] =
    useState(null);

  const [searchTerm,
    setSearchTerm] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

async function loadData() {

    const { data: componentData } =
        await supabase
            .from("component_catalog")
            .select("*");

    setComponents(componentData || []);
}


  const filteredItems =
    components.filter((item) => {

      const plantMatch =
        selectedPlant === "All" ||
        String(item.plant) ===
        selectedPlant;

      const searchMatch =
        item.component_name
          ?.toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          );

      return (
        plantMatch &&
        searchMatch
      );
    });

  return (
  <div className="app">

    <Navbar />

    <div className="plastic-page-filters">

  <div className="search-box">

    <input
      type="text"
      placeholder="Search components..."
      value={searchTerm}
      onChange={(e) =>
        setSearchTerm(
          e.target.value
        )
      }
    />

  </div>

  <div className="plant-filter">

    <h3>Select Plant</h3>

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

      <option value="plant 1">Plant 1</option>
<option value="plant 2">Plant 2</option>
<option value="plant 3">Plant 3</option>
<option value="plant 5">Plant 5</option>
<option value="plant 7">Plant 7</option>

    </select>

  </div>

</div>

    <div className="plastic-main-content">

      <ComponentList
        items={filteredItems}
        setSelectedComponent={
          setSelectedComponent
        }
      />

      <ComponentDetail
        component={
          selectedComponent
        }
      />

    </div>

  </div>
);
  
}

export default PlasticComponents;