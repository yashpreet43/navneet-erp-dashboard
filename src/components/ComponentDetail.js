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
        onError={(e) => {
          e.target.src =
            "/images/default-component.jpg";
        }}
      />

      <h2>
        {component.component_name}
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