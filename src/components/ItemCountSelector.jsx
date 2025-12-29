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
    <div className="bg-base-300 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold">
          表示するアイテム数
        </label>
        <div className="text-sm">
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
          // スライダーのトラック全体（イベントハンドラ用）
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
            {/* スライダーのトラック（背景部分） */}
            <div
              ref={props.ref}
              className="w-full h-1.5 self-center rounded-full bg-base-content/30 relative"
            >
              {/* スライダーの進捗部分 */}
              <div
                className="absolute h-full rounded-full bg-primary"
                style={{ width: `${percent}%` }}
              />
              {children} {/* スライダーのつまみ（サム）がここに含まれます */}
            </div>
          </div>
        )}
        renderThumb={({ props }) => (
          // スライダーのつまみ（外側）
          <div
            {...props}
            style={{
              ...props.style,
            }}
            className="h-6 w-6 rounded-full shadow-md flex justify-center items-center bg-primary"
          >
            {/* スライダーのつまみ（内側ドット） */}
            <div className="h-3 w-3 rounded-full bg-base-100 shadow-md" />
          </div>
        )}
      />

      <div className="flex justify-between text-xs text-base-content/70 mt-2">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default ItemCountSelector;
