import React from "react";
import { availableLeagues } from "../data/processedData";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const Sidebar = ({ filters, onFilterChange, onAnalyze }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onFilterChange({
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const setNumberField = (name, next) => {
    onFilterChange({
      ...filters,
      [name]: next,
    });
  };

  const NumberStepper = ({
    label,
    name,
    value,
    min = 1,
    max = 60,
    step = 1,
    hint = "",
  }) => {
    const vNum = Number(value);
    const safe = Number.isFinite(vNum) ? vNum : min;

    return (
      <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium mb-1">
          {label}
        </label>

        <div className="join w-full">
          <button
            type="button"
            className="btn btn-sm join-item bg-base-300 border-white/10"
            onClick={() => setNumberField(name, clamp(safe - step, min, max))}
            aria-label={`${label} minus`}
          >
            −
          </button>

          <input
            id={name}
            name={name}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={step}
            value={value ?? ""}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isFinite(n)) {
                setNumberField(name, "");
                return;
              }
              setNumberField(name, clamp(n, min, max));
            }}
            className={[
              "input input-bordered input-primary join-item w-full",
              "text-center font-mono",
              // スピナーを消して見た目の「埋まり」を回避
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            ].join(" ")}
            placeholder={`${min}..${max}`}
          />

          <button
            type="button"
            className="btn btn-sm join-item bg-base-300 border-white/10"
            onClick={() => setNumberField(name, clamp(safe + step, min, max))}
            aria-label={`${label} plus`}
          >
            ＋
          </button>
        </div>

        {hint ? (
          <div className="text-[11px] opacity-50 mt-1">{hint}</div>
        ) : null}
      </div>
    );
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

  const isKeepersOn = String(filters.compareLeagues ?? "").trim() === "Keepers";

  return (
    // ★ overflow-hidden にして、中身をスクロール領域化
    <div className="p-4 h-full flex flex-col overflow-hidden">
      <h2 className="text-xl font-bold mb-6 text-primary">Divine Insight</h2>

      {/* ★ここをスクロール可能に */}
      <div className="flex-1 overflow-y-auto pr-1">
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
                    checked={(filters.selectedSourceLeagues || []).includes(config.id)}
                    onChange={() => handleLeagueToggle(config.id)}
                  />
                  <span className="text-sm font-bold opacity-70 group-hover:opacity-100 group-hover:text-amber-200 transition-all">
                    {config.label}
                  </span>
                </label>
              ));
            })()}
          </div>

          <div className="text-[10px] opacity-40 mt-4 pl-1 leading-relaxed italic">
            Select datasets to compare on the chart.
          </div>
        </div>

        {/* Live Data (poe.ninja) - ここは既存のままでOK */}
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest font-black mb-3 text-amber-500/80">
            Live Data (poe.ninja API)
          </label>

          {isKeepersOn ? (
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
                type="button"
              >
                ✕
              </button>
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
        </div>
<div className="grid grid-cols-2 gap-3 mb-6">
  <div>
    <label htmlFor="buyDay" className="block text-sm font-medium mb-1">
      Buy Day
    </label>
    <input
      type="number"
      id="buyDay"
      name="buyDay"
      value={filters.buyDay ?? ""}
      onChange={handleChange}
      className="input input-bordered input-primary w-full pr-3 bg-base-100 ring-1 ring-white/10"
    />
  </div>

  <div>
    <label htmlFor="sellDay" className="block text-sm font-medium mb-1">
      Sell Day
    </label>
    <input
      type="number"
      id="sellDay"
      name="sellDay"
      value={filters.sellDay ?? ""}
      onChange={handleChange}
      className="input input-bordered input-primary w-full pr-3 bg-base-100 ring-1 ring-white/10"
    />
  </div>
</div>


        {/* Budget Filter */}
        <div className="mb-6 p-4 bg-base-300/50 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-base-content/70 uppercase tracking-wider">
              Budget & Currency
            </h4>
          </div>

          {/* Currency Toggle */}
          <div className="flex bg-black/20 p-1 rounded-lg border border-white/5 mb-4 relative ">
            <button
              type="button"
              className={`flex-1 btn btn-xs border-none font-bold transition-all z-10 ${
                filters.currency === "chaos"
                  ? "bg-amber-500 text-black shadow-lg"
                  : "bg-transparent text-base-content/50 hover:text-base-content"
              }`}
              onClick={() => onFilterChange({ ...filters, currency: "chaos" })}
            >
              Chaos (c)
            </button>
            <button
              type="button"
              className={`flex-1 btn btn-xs font-bold transition-all z-10 ${
                filters.currency === "divine"
                  ? "bg-amber-500 text-black shadow-lg border-none"
                  : "bg-transparent text-base-content/50 hover:text-base-content"
              }`}
              onClick={() => onFilterChange({ ...filters, currency: "divine" })}
            >
              Divine (div)
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="minPrice" className="block text-xs font-medium mb-1 opacity-70">Min Price</label>
              <div className="relative">
                <input
                  type="number"
                  id="minPrice"
                  name="minPrice"
                  value={filters.minPrice ?? ""}
                  onChange={handleChange}
                  placeholder="0"
                  className="input input-sm input-bordered w-full pr-8 bg-black/20 focus:bg-black/40 font-mono text-right"
                />
                <span className="absolute right-2 top-1.5 text-xs opacity-30 pointer-events-none">
                  {filters.currency === 'divine' ? 'div' : 'c'}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <label htmlFor="maxPrice" className="block text-xs font-medium mb-1 opacity-70">Max Price</label>
              <div className="relative">
                <input
                  type="number"
                  id="maxPrice"
                  name="maxPrice"
                  value={filters.maxPrice ?? ""}
                  onChange={handleChange}
                  placeholder="∞"
                  className="input input-sm input-bordered w-full pr-8 bg-black/20 focus:bg-black/40 font-mono text-right"
                />
                <span className="absolute right-2 top-1.5 text-xs opacity-30 pointer-events-none">
                  {filters.currency === 'divine' ? 'div' : 'c'}
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* スクロール領域の下に少し余白（Analyzeに被らないように） */}
        <div className="h-4" />
      </div>

      {/* 下の固定ボタン */}
      <button onClick={onAnalyze} className="btn btn-primary w-full mt-4">
        Analyze
      </button>
    </div>
  );
};

export default Sidebar;
