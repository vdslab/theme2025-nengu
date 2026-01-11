import React, { useEffect, useRef, useState } from "react";
import { Range } from "react-range";
import PriceChart from "./PriceChart";
import ItemTable from "./ItemTable";
import { processedChartData } from "../data/processedData.js";

const norm = (s) =>
  String(s ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");

const DashboardPast = ({
  filters,
  analysisRequested,
  apiSeries = [],
  apiError = "",
}) => {
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [dayRange, setDayRange] = useState([1, 30]);
  const [selectedItemNames, setSelectedItemNames] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const prevAnalysisRef = useRef(false);

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

        if (!useAverage && item.leagues && item.leagues[primaryLeague]) {
          targetValues = item.leagues[primaryLeague];
        }

        const buyPrice = findPriceForDay(targetValues, buyDay);
        const sellPrice = findPriceForDay(targetValues, sellDay);

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
            buyPrice,
            sellPrice,
            roi,
            buyDay,
            sellDay,
            values: item.values,
            leagues: item.leagues,
          };
        }

        return null;
      })
      .filter(Boolean);

    const sorted = results.sort((a, b) => b.roi - a.roi);
    setTableData(sorted);
  }, [filters, analysisRequested]);

  // Analyze の立ち上がり時だけ Top10 を初期選択（毎回リセットしない）
  useEffect(() => {
    const prev = prevAnalysisRef.current;
    const now = analysisRequested;

    if (!prev && now) {
      const top10 = tableData.slice(0, 10).map((r) => r.name);
      setSelectedItemNames(top10);
    }

    prevAnalysisRef.current = now;
  }, [analysisRequested, tableData]);

  // selectedItemNames が変わったら chartData を更新（APIがあればマージ）
  useEffect(() => {
    if (Array.isArray(apiSeries) && apiSeries.length > 0) {
      const selectedSet = new Set(selectedItemNames.map(norm));

      const fromApi = apiSeries.filter((s) => selectedSet.has(norm(s.name)));
      const apiNormSet = new Set(fromApi.map((s) => norm(s.name)));

      const fromLocal = processedChartData.filter(
        (item) => selectedSet.has(norm(item.name)) && !apiNormSet.has(norm(item.name))
      );

      setChartData([...fromApi, ...fromLocal]);
      return;
    }

    const sourceLeagues = filters.selectedSourceLeagues || [];

    if (sourceLeagues.length > 0) {
      const expandedData = [];

      processedChartData.forEach((item) => {
        if (!selectedItemNames.includes(item.name)) return;

        sourceLeagues.forEach((league) => {
          let values = null;

          if (league === "Average") {
            values = item.values;
          } else if (item.leagues && item.leagues[league]) {
            values = item.leagues[league];
          }

          if (values) {
            expandedData.push({
              name: item.name,
              icon: item.icon,
              league: league === "Average" ? "Average" : league,
              values,
            });
          }
        });
      });

      setChartData(expandedData);
      return;
    }

    const newChartData = processedChartData.filter((item) =>
      selectedItemNames.includes(item.name)
    );
    setChartData(newChartData);
  }, [selectedItemNames, apiSeries, filters.selectedSourceLeagues]);

  const toggleItemSelection = (itemName) => {
    setSelectedItemNames((prev) => {
      if (prev.includes(itemName)) {
        return prev.filter((n) => n !== itemName);
      }
      return [...prev, itemName];
    });
  };

  const filteredTableData = tableData.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
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

      <div className="h-[45%] flex flex-col min-h-[300px] gap-2">
        <div className="flex-none bg-base-200 px-4 py-2 rounded-lg shadow-sm flex items-center gap-4">
          <span className="text-xs font-bold whitespace-nowrap opacity-70">
            Chart Range
          </span>
          <div className="flex-1 mx-2 relative top-1">
            <Range
              values={dayRange}
              step={1}
              min={1}
              max={60}
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
                        left: `${((dayRange[0] - 1) / 59) * 100}%`,
                        right: `${100 - ((dayRange[1] - 1) / 59) * 100}%`,
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
            <div className="h-4 w-px bg-white/10 mx-1" />
            <div className="flex items-center gap-2">
              <button
                className="btn btn-xs sm:btn-sm bg-base-100 border-2 border-red-900/50 text-red-400 hover:bg-red-900 hover:text-white hover:border-red-600 min-w-[70px] transition-all"
                onClick={() => setSelectedItemNames([])}
                title="Deselect All"
              >
                Clear
              </button>
              <button
                className="btn btn-xs sm:btn-sm bg-base-100 border-2 border-amber-900/50 text-amber-500 hover:bg-amber-700 hover:text-black hover:border-amber-500 min-w-[120px] transition-all"
                onClick={() => {
                  const top10 = filteredTableData.slice(0, 10).map((item) => item.name);
                  setSelectedItemNames(top10);
                }}
                title="Select Top 10 by ROI"
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
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPast;
