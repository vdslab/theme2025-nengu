import React from "react";
import { Range } from "react-range";

const ItemCountSelector = ({
  value,
  min = 1,
  max = 10,
  step = 1,
  onChange,
}) => {
  const clamped = Math.max(min, Math.min(max, value));
  const percent = max === min ? 0 : ((clamped - min) / (max - min)) * 100;

  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-white">
          表示するアイテム数
        </label>
        <div className="text-sm text-white">
          {clamped} 件
        </div>
      </div>

      <Range
        values={[clamped]}
        step={step}
        min={min}
        max={max}
        onChange={(values) => onChange(values[0])}
        renderTrack={({ props, children }) => (
          <div
            onMouseDown={props.onMouseDown}
            onTouchStart={props.onTouchStart}
            style={{
              ...props.style,
              height: "36px",
              display: "flex",
              width: "100%",
            }}
          >
            <div
              ref={props.ref}
              style={{
                height: "6px",
                width: "100%",
                borderRadius: "9999px",
                background: `linear-gradient(to right, #a78bfa 0%, #a78bfa ${percent}%, #4b5563 ${percent}%, #4b5563 100%)`,
                alignSelf: "center",
              }}
            >
              {children}
            </div>
          </div>
        )}
        renderThumb={({ props }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: "22px",
              width: "22px",
              borderRadius: "9999px",
              backgroundColor: "#FFF",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0px 2px 6px #AAA",
            }}
          >
            <div
              style={{
                height: "10px",
                width: "10px",
                borderRadius: "9999px",
                backgroundColor: "#a78bfa",
              }}
            />
          </div>
        )}
      />

      <div className="flex justify-between text-xs text-gray-300 mt-2">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default ItemCountSelector;
