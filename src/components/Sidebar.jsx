import React from "react";
import { availableLeagues } from "../data/processedData";

const Sidebar = ({ filters, onFilterChange, onAnalyze }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    onFilterChange({
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleLeagueToggle = (league) => {
    const current = filters.selectedSourceLeagues || [];
    const newSelection = current.includes(league)
      ? current.filter((l) => l !== league)
      : [...current, league];

    onFilterChange({
      ...filters,
      selectedSourceLeagues: newSelection,
    });
  };

  const setLiveWindowMode = (mode) => {
    onFilterChange({
      ...filters,
      liveWindowMode: mode, // "all" | "last7"
    });
  };

  const isKeepersOn = String(filters.compareLeagues ?? "").trim() === "Keepers";

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-6 text-primary">PoE Market Prophet</h2>

      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-4">Investment Settings</h3>

        {/* Source Data Selection */}
        <div className="mb-6 p-4 bg-black/40 rounded-xl border border-white/10 shadow-inner">
          <label className="block text-xs uppercase tracking-widest font-black mb-4 text-amber-500/80">
            Source Data (Past Leagues)
          </label>

          <div className="space-y-3 ml-1">
            {(() => {
              const leagueConfig = [
                { id: "Average", label: "Average (3 Leagues)" },
                { id: "Mercenaries", label: "Mercenaries (3.26)" },
                { id: "Settlers", label: "Settlers (3.25)" },
                { id: "Necropolis", label: "Necropolis (3.24)" },
              ];

              const leaguesToList = leagueConfig.filter(
                (config) =>
                  config.id === "Average" ||
                  (availableLeagues || []).includes(config.id)
              );

              return leaguesToList.map((config) => (
                <label
                  key={config.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm border-2 border-white/20 bg-white/5 checked:bg-amber-500 checked:border-amber-500 [--chkbg:theme(colors.amber.500)] [--chkfg:black] group-hover:border-amber-500/50 transition-all"
                    checked={(filters.selectedSourceLeagues || []).includes(
                      config.id
                    )}
                    onChange={() => handleLeagueToggle(config.id)}
                  />
                  <span className="text-sm font-bold opacity-70 group-hover:opacity-100 group-hover:text-amber-200 transition-all">
                    {config.label}
                  </span>
                </label>
              ));
            })()}

            {(!availableLeagues || availableLeagues.length === 0) && (
              <div className="text-xs opacity-50">No local data available</div>
            )}
          </div>

          <div className="text-[10px] opacity-40 mt-4 pl-1 leading-relaxed italic">
            Select datasets to compare on the chart.
          </div>
        </div>

        {/* Live Data (poe.ninja) */}
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest font-black mb-3 text-amber-500/80">
            Live Data (poe.ninja API)
          </label>

          {isKeepersOn ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl shadow-lg shadow-amber-500/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-amber-500 uppercase leading-none mb-1">
                    Live Mode
                  </span>
                  <span className="text-sm font-bold text-white">Keepers</span>
                </div>

                <button
                  onClick={() => onFilterChange({ ...filters, compareLeagues: "" })}
                  className="btn btn-circle btn-ghost btn-xs text-error hover:bg-error/20"
                  title="Remove live data"
                >
                  ✕
                </button>
              </div>

              {/* ★追加：直近7日切り替え */}
              <div className="p-3 bg-black/30 rounded-xl border border-white/10">
                <div className="text-[10px] opacity-60 mb-2 uppercase tracking-widest font-black">
                  Live Window
                </div>

                <div className="bg-black/40 p-1 rounded-lg flex gap-1 border border-white/10">
                  <button
                    className={`btn btn-xs no-animation px-3 rounded border-none ${
                      filters.liveWindowMode === "all"
                        ? "bg-amber-500 text-black font-extrabold"
                        : "bg-transparent text-base-content/50 hover:text-base-content/80"
                    }`}
                    onClick={() => setLiveWindowMode("all")}
                    type="button"
                    title="Show all sparkline points"
                  >
                    All
                  </button>

                  <button
                    className={`btn btn-xs no-animation px-3 rounded border-none ${
                      filters.liveWindowMode === "last7"
                        ? "bg-amber-500 text-black font-extrabold"
                        : "bg-transparent text-base-content/50 hover:text-base-content/80"
                    }`}
                    onClick={() => setLiveWindowMode("last7")}
                    type="button"
                    title="Show last 7 points"
                  >
                    Last 7
                  </button>
                </div>

                <div className="text-[10px] opacity-40 mt-2 leading-relaxed italic">
                  "Last 7" shows the last 7 sparkline points (not league Day 1..7).
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onFilterChange({ ...filters, compareLeagues: "Keepers" });
                onAnalyze();
              }}
              className="btn w-full bg-amber-500 hover:bg-amber-400 text-black border-none font-black shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              Fetch Keepers Data
            </button>
          )}

          <div className="text-[10px] opacity-40 mt-3 px-1 leading-relaxed italic">
            Compare past trends with current Live league price action.
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="buyDay" className="block text-sm font-medium mb-1">
            Buy Day (e.g., Day 3)
          </label>
          <input
            type="number"
            id="buyDay"
            name="buyDay"
            value={filters.buyDay ?? ""}
            onChange={handleChange}
            className="input input-bordered input-primary w-full"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="sellDay" className="block text-sm font-medium mb-1">
            Sell Day (e.g., Day 14)
          </label>
          <input
            type="number"
            id="sellDay"
            name="sellDay"
            value={filters.sellDay ?? ""}
            onChange={handleChange}
            className="input input-bordered input-primary w-full"
          />
        </div>

        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            id="showHighlight"
            name="showHighlight"
            checked={!!filters.showHighlight}
            onChange={handleChange}
            className="checkbox checkbox-primary"
          />
          <label htmlFor="showHighlight" className="ml-2 text-sm font-medium">
            Show Buy/Sell Highlight
          </label>
        </div>

        <div>
          <h4 className="font-medium mb-2">Budget (Chaos Orbs)</h4>

          <div className="flex items-center justify-between mb-2">
            <label htmlFor="minPrice" className="text-sm">
              Min
            </label>
            <input
              type="number"
              id="minPrice"
              name="minPrice"
              value={filters.minPrice ?? ""}
              onChange={handleChange}
              placeholder="e.g., 100"
              className="input input-bordered input-primary w-2/3"
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="maxPrice" className="text-sm">
              Max
            </label>
            <input
              type="number"
              id="maxPrice"
              name="maxPrice"
              value={filters.maxPrice ?? ""}
              onChange={handleChange}
              placeholder="e.g., 5000"
              className="input input-bordered input-primary w-2/3"
            />
          </div>
        </div>
      </div>

      <button onClick={onAnalyze} className="btn btn-primary w-full mt-6">
        Analyze
      </button>
    </div>
  );
};

export default Sidebar;
