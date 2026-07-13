function ComponentList({
  items,
  setSelectedComponent,
}) {
  return (
    <div className="component-list">
      {items.map((item, index) => (
        <div
          key={index}
          className="component-card"
          onClick={() =>
            setSelectedComponent(item)
          }
        >
          <img
  src={`/images/components/${item.image_name}`}
  alt={item.component_name}
  className="component-image"
  loading="lazy"
  onError={(e) => {
    e.target.style.display = "none";
  }}
/>

          <div className="component-card-content">
            <h3>
              {item.component_name}
              {item.status === "Auto Created" && (
                <span className="badge-ai-discovered" style={{
                  background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                  color: "#ffffff",
                  fontSize: "9px",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  marginLeft: "8px",
                  display: "inline-block",
                  verticalAlign: "middle",
                  fontWeight: "bold",
                  boxShadow: "0 2px 6px rgba(124, 58, 237, 0.4)"
                }}>
                  AI Discovered
                </span>
              )}
            </h3>

            <p>
              <strong>Plant:</strong>{" "}
              {item.plant}
            </p>

            <p>
              <strong>Company:</strong>{" "}
              {item.company}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ComponentList;