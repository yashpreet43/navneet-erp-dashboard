function ComponentDetail({ component }) {
  if (!component) {
    return (
      <div className="detail-panel">
        <h2>Select a Component</h2>
      </div>
    );
  }

  return (
    <div className="detail-panel">
      <img
        src={`/images/components/${component.image_name}`}
        alt={component.component_name}
        className="detail-image"
      />

      <h2>
        {component.component_name}
        {component.status === "Auto Created" && (
          <span className="badge-ai-discovered" style={{
            background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
            color: "#ffffff",
            fontSize: "11px",
            padding: "4px 8px",
            borderRadius: "8px",
            marginLeft: "10px",
            display: "inline-block",
            verticalAlign: "middle",
            fontWeight: "bold",
            boxShadow: "0 2px 8px rgba(124, 58, 237, 0.4)"
          }}>
            AI Discovered
          </span>
        )}
      </h2>

      <p>
        <strong>Company:</strong>{" "}
        {component.company}
      </p>

      <p>
        <strong>Plant:</strong>{" "}
        {component.plant}
      </p>

      <p>
        <strong>Weight:</strong>{" "}
        {component.weight}
      </p>

      <p>
        <strong>Selling Price:</strong>{" "}
        ₹{component.selling_price}
      </p>

      <p>
        <strong>Manufacturing Cost:</strong>{" "}
        ₹{component.manufacturing_cost}
      </p>

      <p>
        <strong>Profit/Piece:</strong>{" "}
        ₹{component.profit}
      </p>
    </div>
  );
}

export default ComponentDetail;