import React, { useEffect, useMemo, useState } from "react";
import { Range } from "react-range";
import PriceChart from "./PriceChart";
import ItemTable from "./ItemTable";
import { processedChartData } from "../data/processedData.js";

// API名とローカル名が微妙に違っても拾えるように正規化
const norm = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/s$/, "");

const Dashboard = ({ filters, analysisRequested, apiSeries = [], apiError = "", isLoading = false }) => {
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);

  // 7日/30日切替
  const [windowPreset, setWindowPreset] = useState("7d"); // "7d" | "30d"
  const windowMax = windowPreset === "7d" ? 7 : 30;

  const [dayRange, setDayRange] = useState([1, windowMax]);
  const [selectedItemNames, setSelectedItemNames] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setDayRange([1, windowMax]);
  }, [windowMax]);

  // Divine Orb Price Lookup Helper
  const getDivinePrice = (day, league) => {
    // 1. Try to find in API series (Live)
    // Check if the requested league matches the API series context or if it's "Keepers"
    if (league === "Keepers" || (apiSeries.length > 0 && apiSeries[0].league === league)) {
        const liveDiv = apiSeries.find(i => norm(i.name) === "divineorb");
        if (liveDiv) {
            const p = liveDiv.values.find(v => v.day === day)?.price;
            if (p) return p;
        }
    }

    // 2. Try to find in Local Processed Data
    const localDiv = processedChartData.find(i => norm(i.name) === "divineorb");
    if (localDiv) {
        let series = [];
        if (league === "Average") {
            series = localDiv.values;
        } else if (localDiv.leagues && localDiv.leagues[league]) {
            series = localDiv.leagues[league];
        }
        
        const p = series.find(v => v.day === day)?.price;
        if (p) return p;
    }
    
    return null; // Return null if not found (implies cannot convert validly)
  };

  // Convert a raw chaos price to the target currency
  const convertPrice = (chaosPrice, day, league) => {
      if (filters.currency !== "divine") return chaosPrice;
      const divPrice = getDivinePrice(day, league);
      if (!divPrice || divPrice === 0) return 0; // Avoid Infinity
      return chaosPrice / divPrice;
  };

  // ROIテーブル生成（既存ロジック維持 + 通貨変換適用）
  useEffect(() => {
    if (!analysisRequested) return;

    const findPriceForDay = (values, day) => {
      if (!Array.isArray(values)) return null;
      const dataPoint = values.find((v) => v.day === day);
      return dataPoint ? dataPoint.price : null;
    };

    const buyDay = parseInt(filters.buyDay, 10);
    const sellDay = parseInt(filters.sellDay, 10);

    const sourceLeagues = filters.selectedSourceLeagues || [];
    const useAverage = sourceLeagues.length === 0 || sourceLeagues.includes("Average");
    const primaryLeague = useAverage ? "Average" : sourceLeagues[0];

    const results = processedChartData
      .map((item) => {
        let targetValues = item.values;
        let actualLeague = "Average";

        if (!useAverage && item.leagues && item.leagues[primaryLeague]) {
          targetValues = item.leagues[primaryLeague];
          actualLeague = primaryLeague;
        }

        const rawBuyPrice = findPriceForDay(targetValues, buyDay);
        const rawSellPrice = findPriceForDay(targetValues, sellDay);

        // フィルタリングは Chaos ベースで行う (ユーザー入力がChaos想定の場合)
        // もしユーザー入力もDivineベースにするならここで変換が必要だが、
        // 既存実装の Budget Filter は "Currency (c)" と書いてあったのでChaosベースとして扱う。
        // -> 今回UIで "Min Price (div)" 等に切り替わるようにしたので、入力値もその通貨基準とみなすべき。
        // -> つまり、比較対象の `buyPrice` を `convertPrice` してから比較する。

        const buyPrice = rawBuyPrice !== null ? convertPrice(rawBuyPrice, buyDay, actualLeague) : null;
        const sellPrice = rawSellPrice !== null ? convertPrice(rawSellPrice, sellDay, actualLeague) : null;

        if (
          buyPrice === null ||
          (filters.minPrice && buyPrice < parseFloat(filters.minPrice)) ||
          (filters.maxPrice && buyPrice > parseFloat(filters.maxPrice))
        ) {
          return null;
        }

        if (sellPrice !== null) {
          const roi = (sellPrice - buyPrice) / buyPrice;
          return {
            name: item.name,
            icon: item.icon,
            buyPrice,   // Converted
            sellPrice,  // Converted
            roi,
            buyDay,
            sellDay,
            values: targetValues, // Raw Chaos values (ItemTable needs raw to re-calc or we pass converted?) 
            // ItemTable currently does calc internally for multi-league. 
            // We should let ItemTable handle multi-league conversion if we want consistent display.
            // For now, this `buyPrice` / `sellPrice` is for the "Summary" or sorting.
            leagues: item.leagues,
          };
        }

        return null;
      })
      .filter(Boolean);

    const sorted = results.sort((a, b) => b.roi - a.roi);
    setTableData(sorted);

    const defaultSelected = sorted.slice(0, 10).map((r) => r.name);
    setSelectedItemNames(defaultSelected);
  }, [filters, analysisRequested, apiSeries]); // Added apiSeries to dependency as getDivinePrice depends on it

  // チャートデータ生成
  useEffect(() => {
    const sourceLeagues = filters.selectedSourceLeagues || [];
    const leaguesToShow = sourceLeagues.length > 0 ? sourceLeagues : ["Average"];

    const selectedSet = new Set(selectedItemNames.map(norm));

    // 1) ローカル（過去リーグ）を展開
    const localExpanded = [];
    processedChartData.forEach((item) => {
      if (!selectedSet.has(norm(item.name))) return;

      leaguesToShow.forEach((league) => {
        let values = null;

        if (league === "Average") {
          values = item.values;
        } else if (item.leagues && item.leagues[league]) {
          values = item.leagues[league];
        }

        if (values && values.length > 0) {
            // Apply conversion to entire series
            const convertedValues = values.map(v => ({
                ...v,
                price: convertPrice(v.price, v.day, league === "Average" ? "Average" : league)
            }));

            localExpanded.push({
                name: item.name,
                icon: item.icon,
                league: league === "Average" ? "Average" : league,
                values: convertedValues,
            });
        }
      });
    });

    // 2) API（Keepers）を追加（名前はnormで照合）
    const apiExpanded =
      Array.isArray(apiSeries) && apiSeries.length > 0
        ? apiSeries
            .filter((s) => selectedSet.has(norm(s.name)))
            .map((s) => {
                const leagueName = s.league || "Keepers";
                const convertedValues = s.values.map(v => ({
                    ...v,
                    price: convertPrice(v.price, v.day, leagueName)
                }));
                return {
                    ...s,
                    league: leagueName,
                    values: convertedValues
                };
            })
        : [];

    // 3) 結合（Keepers + 過去リーグ）
    setChartData([...apiExpanded, ...localExpanded]);
  }, [selectedItemNames, apiSeries, filters.selectedSourceLeagues, filters.currency]);

  const toggleItemSelection = (itemName) => {
    setSelectedItemNames((prev) => {
      if (prev.includes(itemName)) return prev.filter((n) => n !== itemName);
      return [...prev, itemName];
    });
  };

  const filteredTableData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tableData.filter((item) => item.name.toLowerCase().includes(q));
  }, [tableData, searchQuery]);

  const denom = Math.max(1, windowMax - 1);

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden relative">
      {apiError && (
        <div className="alert alert-error shadow-lg">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{apiError}</span>
          </div>
        </div>
      )}

      {/* --- Chart --- */}
      <div className="h-[45%] flex flex-col min-h-[300px] gap-2">
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
              className={`btn btn-xs no-animation px-3 rounded border-none ${
                windowPreset === "30d"
                  ? "bg-amber-500 text-black font-extrabold"
                  : "bg-transparent text-base-content/50 hover:text-base-content/80"
              }`}
              onClick={() => setWindowPreset("30d")}
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
            {dayRange[0]} - {dayRange[1]}
          </span>
        </div>

        <div className="flex-1 min-h-0 bg-base-200 rounded-lg shadow-inner overflow-hidden relative">
          <PriceChart
            data={chartData}
            filters={filters}
            dayRange={dayRange}
            colorDomain={processedChartData.map((d) => d.name)}
          />
        </div>
      </div>

      {/* --- Table --- */}
      <div className="flex-1 min-h-0 flex flex-col bg-base-200 rounded-lg shadow-xl overflow-hidden border border-white/5">
        <div className="p-3 border-b border-white/5 bg-base-300/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="font-bold text-base text-base-content/90">Top Candidates</h3>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search items..."
              className="input input-sm input-bordered bg-base-100 border-white/10 w-48 focus:w-64 transition-all focus:border-amber-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="h-4 w-px bg-white/50 mx-1" />
            <div className="flex items-center gap-2">
              <button
                className="btn btn-xs sm:btn-sm bg-base-100 border-2 border-red-900/50 text-red-400 hover:bg-red-900 hover:text-white hover:border-red-600 min-w-[70px] transition-all"
                onClick={() => setSelectedItemNames([])}
                type="button"
              >
                Clear
              </button>
              <button
                className="btn btn-xs sm:btn-sm bg-base-100 border-2 border-amber-900/50 text-amber-500 hover:bg-amber-700 hover:text-black hover:border-amber-500 min-w-[120px] transition-all"
                onClick={() => {
                  const top10 = filteredTableData.slice(0, 10).map((item) => item.name);
                  setSelectedItemNames(top10);
                }}
                type="button"
              >
                Select Top 10
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto relative">
          <ItemTable
            data={filteredTableData}
            selectedItems={selectedItemNames}
            onToggleItem={toggleItemSelection}
            selectedSourceLeagues={filters.selectedSourceLeagues}
            filters={filters} // Pass filters to allow conversion inside ItemTable if needed, or if we pass raw
            // Actually, we are passing `data` which has `values` (raw) and `buyPrice`/`sellPrice` (converted).
            // ItemTable logic needs to be updated to use conversion for the expanded columns.
            // So we pass the `convertPrice` function or let ItemTable handle it?
            // Better to pass `convertPrice` or `getDivinePrice` to ItemTable? 
            // Or just pass the `currency` and `divinePriceMap`?
            // Simpler: Dashboard handles data preparation.
            // But ItemTable renders dynamic columns based on `selectedSourceLeagues`.
            // So ItemTable needs access to conversion logic.
            // I'll pass a `convertPrice` prop to ItemTable.
            convertPrice={convertPrice}
          />
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-base-100/50 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <span className="text-sm font-semibold opacity-80 animate-pulse">Fetching poe.ninja data...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;