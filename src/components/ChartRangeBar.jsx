import React from "react";
import { Range } from "react-range";

const ChartRangeBar = ({
  isKeepersLive,
  windowPreset,
  setWindowPreset,
  windowMax,
  dayRange,
  setDayRange,
}) => {
  const denom = Math.max(1, windowMax - 1);

  const keepersRangeLabel = (() => {
    const formatDate = (d) => {
      const date = new Date();
      date.setDate(date.getDate() - (7 - d));
      return date.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
    };
    return `${formatDate(dayRange[0])} - ${formatDate(dayRange[1])}`;
  })();

  return (
    <div className="flex-none bg-base-200 px-4 py-2 rounded-lg shadow-sm flex items-center gap-4">
      <span className="text-xs font-bold whitespace-nowrap opacity-70">
        Chart Range
      </span>

      <div className="bg-black/30 p-1 rounded-lg flex gap-1 border border-white/10">
        <button
          type="button"
          className={`btn btn-xs no-animation px-3 rounded border-none ${
            windowPreset === "7d"
              ? "bg-amber-500 text-black font-extrabold"
              : "bg-transparent text-base-content/50 hover:text-base-content/80"
          }`}
          onClick={() => setWindowPreset("7d")}
        >
          7D
        </button>

        <button
          type="button"
          disabled={isKeepersLive}
          className={`btn btn-xs no-animation px-3 rounded border-none ${
            windowPreset === "30d" && !isKeepersLive
              ? "bg-amber-500 text-black font-extrabold"
              : "bg-transparent text-base-content/50 hover:text-base-content/80"
          } ${isKeepersLive ? "opacity-30 cursor-not-allowed" : ""}`}
          onClick={() => setWindowPreset("30d")}
          title={isKeepersLive ? "Keepers表示中は7D固定です" : "30D"}
        >
          30D
        </button>
      </div>

      <div className="flex-1 mx-2 relative top-1">
        <Range
          values={dayRange}
          step={1}
          min={1}
          max={windowMax}
          onChange={(values) => setDayRange(values)}
          renderTrack={({ props, children }) => (
            <div
              onMouseDown={props.onMouseDown}
              onTouchStart={props.onTouchStart}
              style={{ ...props.style, height: "16px", display: "flex", width: "100%" }}
            >
              <div
                ref={props.ref}
                className="w-full h-1 self-center rounded-full bg-base-content/20 relative"
              >
                <div
                  className="absolute h-full bg-primary"
                  style={{
                    left: `${((dayRange[0] - 1) / denom) * 100}%`,
                    right: `${100 - ((dayRange[1] - 1) / denom) * 100}%`,
                  }}
                />
                {children}
              </div>
            </div>
          )}
          renderThumb={({ props, isDragged }) => {
            const { key, style, ...restProps } = props;
            return (
              <div
                key={key}
                {...restProps}
                style={style}
                className={`h-4 w-4 rounded-full shadow-sm flex justify-center items-center cursor-grab hover:scale-110 transition-transform ${
                  isDragged ? "bg-primary-focus ring-2 ring-primary/50" : "bg-primary"
                }`}
              />
            );
          }}
        />
      </div>

      <span className="text-xs font-mono opacity-70 min-w-[90px] text-right">
        {isKeepersLive ? keepersRangeLabel : `${dayRange[0]} - ${dayRange[1]}`}
      </span>
    </div>
  );
};

export default ChartRangeBar;
