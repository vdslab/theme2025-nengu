import React, { useRef } from "react";
import { availableLeagues } from "../data/processedData";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// --- Components for Help ---

const HelpIcon = ({ text, position = "tooltip-left", className = "" }) => (
  // Force tooltip to specified direction
  // Use z-50 to try to layer above other elements
  <div 
    className={`tooltip ${position} ${className} ml-1 align-middle z-50 before:whitespace-normal before:max-w-[10rem] before:text-left before:text-xs before:content-[attr(data-tip)]`} 
    data-tip={text}
  >
    <button type="button" className="btn btn-xs btn-circle btn-ghost text-base-content/50 hover:text-info min-h-0 w-4 h-4 p-0">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    </button>
  </div>
);

const GuideModal = ({ id }) => (
  <dialog id={id} className="modal">
    <div className="modal-box bg-base-100 border border-white/10 max-w-2xl">
      <h3 className="font-bold text-xl text-primary mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        How to Use "Divine Insight"
      </h3>
      
      <div className="py-4 space-y-6 text-sm text-base-content/80 leading-relaxed">
        <section>
          <h4 className="font-bold text-amber-500 mb-2">1. Set Conditions (Investment Settings)</h4>
          <p>
            First, configure your investment strategy in the sidebar.
            <br/>
            - <strong>Buy/Sell Day:</strong> Specify the day of the league you plan to buy and sell. The tool calculates ROI based on price changes during this period.
            <br/>
            - <strong>Budget:</strong> Set your minimum and maximum budget and choose your currency (Chaos or Divine).
          </p>
        </section>

        <section>
          <h4 className="font-bold text-amber-500 mb-2">2. Choose Data Sources</h4>
          <p>
            Decide which data to analyze.
            <br/>
            - <strong>Source Data:</strong> Select past leagues to see historical trends. "Average" combines data from recent leagues.
            <br/>
            - <strong>Live Data (Keepers):</strong> Fetch real-time data from the current league via poe.ninja API to find opportunities right now.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-amber-500 mb-2">3. Analyze & Discover</h4>
          <p>
            Click the <span className="badge badge-primary badge-sm">Analyze</span> button. 
            The table will list items sorted by profitability (ROI). 
            Select items from the table to compare them on the chart.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-amber-500 mb-2">4. Visual Analysis (Chart)</h4>
          <p>
            Use the chart to verify price movements.
            <br/>
            - <strong>Trend:</strong> Line chart showing daily price history.
            <br/>
            - <strong>Scatter:</strong> Risk vs. Reward plot.
            <br/>
            - <strong>Range:</strong> Displays the min/max price variance for selected items.
          </p>
        </section>
      </div>

      <div className="modal-action">
        <form method="dialog">
          <button className="btn">Got it</button>
        </form>
      </div>
    </div>
    <form method="dialog" className="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
);


const Sidebar = ({ filters, onFilterChange, onAnalyze }) => {
  const modalId = "guide_modal";

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
        <label htmlFor={name} className="flex items-center text-sm font-medium mb-1">
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

        {hint ? <div className="text-[11px] opacity-50 mt-1">{hint}</div> : null}
      </div>
    );
  };

  const handleLeagueToggle = (league) => {
    // Keepers中は過去リーグ選択不可（念のためガード）
    const isKeepersOn = String(filters.compareLeagues ?? "").trim() === "Keepers";
    if (isKeepersOn) return;

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
    <div className="p-4 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-primary">Divine Insight</h2>
        <button 
          className="btn btn-sm btn-circle btn-ghost text-amber-500 hover:bg-amber-500/10"
          onClick={() => document.getElementById(modalId).showModal()}
          title="How to use"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </button>
      </div>

      <GuideModal id={modalId} />

      <div className="flex-1 overflow-y-auto pr-1">
        <h3 className="text-lg font-semibold mb-4">Investment Settings</h3>

        {/* Source Data Selection */}
        <div
          className={[
            "mb-6 p-4 rounded-xl border shadow-inner",
            isKeepersOn
              ? "bg-black/20 border-white/5 opacity-60"
              : "bg-black/40 border-white/10",
          ].join(" ")}
        >
          <div className="flex items-center mb-4">
            <label className="block text-xs uppercase tracking-widest font-black text-amber-500/80">
              Source Data (Past Leagues)
            </label>
            <HelpIcon text="Select historical league data to analyze past price trends. 'Average' combines data from the last 3 leagues to show typical market behavior." />
          </div>

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
                  className={[
                    "flex items-center gap-3 group",
                    isKeepersOn ? "cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                  title={isKeepersOn ? "Keepers表示中は過去データを選択できません" : ""}
                >
                  <input
                    type="checkbox"
                    disabled={isKeepersOn}
                    className={[
                      "checkbox checkbox-sm border-2 border-white/20 bg-white/5",
                      "checked:bg-amber-500 checked:border-amber-500 [--chkbg:theme(colors.amber.500)] [--chkfg:black]",
                      "transition-all",
                      isKeepersOn
                        ? "opacity-40"
                        : "group-hover:border-amber-500/50",
                    ].join(" ")}
                    checked={(filters.selectedSourceLeagues || []).includes(config.id)}
                    onChange={() => handleLeagueToggle(config.id)}
                  />
                  <span
                    className={[
                      "text-sm font-bold transition-all",
                      isKeepersOn
                        ? "opacity-50"
                        : "opacity-70 group-hover:opacity-100 group-hover:text-amber-200",
                    ].join(" ")}
                  >
                    {config.label}
                  </span>
                </label>
              ));
            })()}
          </div>

          {isKeepersOn ? (
            <div className="text-[10px] opacity-60 mt-4 pl-1 leading-relaxed italic">
              Keepers（Live）表示中は比較条件を固定するため、過去リーグは選択できません。
            </div>
          ) : (
            <div className="text-[10px] opacity-40 mt-4 pl-1 leading-relaxed italic">
              Select datasets to compare on the chart.
            </div>
          )}
        </div>

        {/* Live Data (poe.ninja) */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <label className="block text-xs uppercase tracking-widest font-black text-amber-500/80">
              Live Data (poe.ninja API)
            </label>
            <HelpIcon text="Fetch real-time market data from the current active league via poe.ninja API. Use this to find profitable flips right now." />
          </div>

          {isKeepersOn ? (
            <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl shadow-lg shadow-amber-500/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-amber-500 uppercase leading-none mb-1">
                  Live Mode
                </span>
                <span className="text-sm font-bold text-white">Keepers</span>
              </div>

              <button
                onClick={() => {
                  // Keepers解除
                  onFilterChange({ ...filters, compareLeagues: "" });
                }}
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
                // Keepers ON + 過去リーグ選択をクリア（混在防止）
                onFilterChange({
                  ...filters,
                  compareLeagues: "Keepers",
                  selectedSourceLeagues: [],
                });
                onAnalyze();
              }}
              className="btn w-full bg-amber-500 hover:bg-amber-400 text-black border-none font-black shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              Fetch Keepers Data
            </button>
          )}
        </div>

        {/* Buy/Sell */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <div className="flex items-center mb-1">
              <label htmlFor="buyDay" className="block text-sm font-medium">
                Buy Day
              </label>
              <HelpIcon 
                text="The day of the league (Day X) you plan to purchase the item. Early league prices are often lower." 
                position="tooltip-bottom" 
                className="before:left-0 before:translate-x-0"
              />
            </div>
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
             <div className="flex items-center mb-1">
              <label htmlFor="sellDay" className="block text-sm font-medium">
                Sell Day
              </label>
              <HelpIcon text="The day of the league (Day X) you plan to sell. The tool calculates ROI based on the price difference between Buy and Sell days." />
            </div>
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

        {/* Budget & Currency */}
        <div className="mb-6 p-4 bg-base-300/50 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-base-content/70 uppercase tracking-wider">
              Budget & Currency
            </h4>
            <HelpIcon text="Filter the item list to show only items within your minimum and maximum budget, in your preferred currency." />
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
              <label
                htmlFor="minPrice"
                className="block text-xs font-medium mb-1 opacity-70"
              >
                Min Price
              </label>
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
                  {filters.currency === "divine" ? "div" : "c"}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <label
                htmlFor="maxPrice"
                className="block text-xs font-medium mb-1 opacity-70"
              >
                Max Price
              </label>
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
                  {filters.currency === "divine" ? "div" : "c"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-4" />
      </div>

      <button onClick={onAnalyze} className="btn btn-primary w-full mt-4">
        Analyze
      </button>
    </div>
  );
};

export default Sidebar;
