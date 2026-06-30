function Filters({
  selectedCategory,
  setSelectedCategory,
  selectedPlant,
  setSelectedPlant,
  searchTerm,
  setSearchTerm,
}) {

  return (
    <div className="filters">

      {/* CATEGORY BUTTONS */}

      <div className="category-buttons">

        <button
          onClick={() => {
            setSelectedCategory("plastic");
            setSelectedPlant("All");
          }}
        >
          Plastic Components
        </button>

        <button
          onClick={() => {
            setSelectedCategory("fabrication");
            setSelectedPlant("All");
          }}
        >
          Fabrication
        </button>

        <button
          onClick={() => {
            setSelectedCategory("repairing");
            setSelectedPlant("All");
          }}
        >
          Repairing / Engineering
        </button>

      </div>

      {/* SEARCH + FILTER */}

      {selectedCategory && (

        <div>

          {/* SEARCH BAR */}

          <div className="search-box">

            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

          </div>

          {/* PLANT FILTER */}

          <div className="plant-filter">

            <h3>Select Plant</h3>

            <select
              value={selectedPlant}
              onChange={(e) =>
                setSelectedPlant(e.target.value)
              }
            >
              <option value="All">All Plants</option>

<option value="plant 1">Plant 1</option>

<option value="plant 2">Plant 2</option>

<option value="plant 3">Plant 3</option>

<option value="plant 5">Plant 5</option>

<option value="plant 7">Plant 7</option>

            </select>

          </div>

        </div>
      )}

    </div>
  );
}

export default Filters;