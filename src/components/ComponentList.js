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