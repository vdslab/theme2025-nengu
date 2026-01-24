import React from "react";

const PriceChartHeader = ({
  viewType,
  setViewType,
  trendMode,
  setTrendMode,
  legendItems = [],
}) => {
  return (
    <div className="flex-none flex flex-wrap items-center justify-between gap-4 mb-2">
      <div className="flex items-center gap-4">
        <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-widest">
          Price History
        </h3>

        {/* View Toggle: Trend / Scatter */}
        <div className="bg-black/40 p-1 rounded-lg flex gap-1 border border-white/10 shadow-lg">
          <div className="tooltip tooltip-bottom z-50 before:whitespace-normal before:max-w-xs before:text-left before:text-white before:content-[attr(data-tip)]" data-tip="A line chart tracking the daily price history of items. Use this to spot long-term trends and stability.">
            <button
              type="button"
              className={[
                "btn btn-xs no-animation px-4 rounded transition-all border-none",
                viewType === "trend"
                  ? "bg-amber-500 text-black font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  : "bg-transparent text-base-content/50 hover:text-base-content/80",
              ].join(" ")}
              onClick={() => setViewType("trend")}
            >
              Trend
            </button>
          </div>
          <div className="tooltip tooltip-bottom z-50 before:whitespace-normal before:max-w-xs before:text-left before:text-white before:content-[attr(data-tip)]" data-tip="A scatter plot visualizing Risk (horizontal) vs. ROI (vertical). Items in the top-left offer high returns with low risk.">
            <button
              type="button"
              className={[
                "btn btn-xs no-animation px-4 rounded transition-all border-none",
                viewType === "scatter"
                  ? "bg-amber-500 text-black font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  : "bg-transparent text-base-content/50 hover:text-base-content/80",
              ].join(" ")}
              onClick={() => setViewType("scatter")}
            >
              Scatter
            </button>
          </div>
          <div className="tooltip tooltip-bottom z-50 before:whitespace-normal before:max-w-xs before:text-left before:text-white before:content-[attr(data-tip)]" data-tip="Displays the price variability (Min vs Max) for each day. Wider bands indicate volatile prices, narrower bands mean stability.">
            <button
              type="button"
              className={[
                "btn btn-xs no-animation px-4 rounded transition-all border-none",
                viewType === "range"
                  ? "bg-amber-500 text-black font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  : "bg-transparent text-base-content/50 hover:text-base-content/80",
              ].join(" ")}
              onClick={() => setViewType("range")}
            >
              Range
            </button>
          </div>
        </div>

        {/* Trendのときだけ Price / ROI% */}
        {viewType === "trend" && (
          <div className="bg-black/40 p-1 rounded-lg flex gap-1 border border-white/10 shadow-lg">
            <button
              type="button"
              className={[
                "btn btn-xs no-animation px-4 rounded transition-all border-none",
                trendMode === "price"
                  ? "bg-amber-500 text-black font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  : "bg-transparent text-base-content/50 hover:text-base-content/80",
              ].join(" ")}
              onClick={() => setTrendMode("price")}
            >
              Price
            </button>
            <button
              type="button"
              className={[
                "btn btn-xs no-animation px-4 rounded transition-all border-none",
                trendMode === "roi"
                  ? "bg-amber-500 text-black font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  : "bg-transparent text-base-content/50 hover:text-base-content/80",
              ].join(" ")}
              onClick={() => setTrendMode("roi")}
            >
              ROI %
            </button>
          </div>
        )}
      </div>

      {/* Legend: item name で統合（リーグは表示しない） */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-end flex-1">
        {legendItems.length > 10 ? (
          <span className="text-[10px] font-medium text-base-content/30 italic">
            Legend hidden (&gt;10 items selected)
          </span>
        ) : (
          legendItems.map((it) => (
            <div key={it.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: it.color }} />
              <span className="text-[10px] font-medium text-base-content/70 whitespace-nowrap">
                {it.name}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PriceChartHeader;
