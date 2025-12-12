import React from "react";

const Tooltip = ({ visible, x, y, name, day, price }) => {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-lg border border-gray-600"
      style={{
        left: x + 12,
        top: y - 12,
        transform: "translate(0, -100%)",
        whiteSpace: "nowrap",
      }}
    >
      <div className="font-bold text-yellow-400">{name}</div>
      <div>Day {day}</div>
      <div>{price.toFixed(2)} c</div>
    </div>
  );
};

export default Tooltip;
