import React, { useState, useRef, useEffect, useCallback } from "react";
import PriceChart from "./PriceChart";
import ItemTable from "./ItemTable";
import { processedChartData } from "../data/processedData.js";

import ChartRangeBar from "./ChartRangeBar";
import TableHeaderBar from "./TableHeaderBar";
import LoadingOverlay from "./LoadingOverlay";

import { useWindowRange } from "../hooks/useWindowRange";
import { useDivineConverter } from "../hooks/useDivineConverter";
import { useRoiTable } from "../hooks/useRoiTable";
import { useChartSeries } from "../hooks/useChartSeries";
import { useSortConfig, useSortedTableData } from "../hooks/useSortedTableData";

const Dashboard = ({
  filters,
  analysisRequested,
  apiSeries = [],
  apiError = "",
  isLoading = false,
}) => {
  const {
    isKeepersLive,
    windowPreset,
    setWindowPreset,
    windowMax,
    dayRange,
    setDayRange,
  } = useWindowRange(filters.compareLeagues);

  const { convertPrice } = useDivineConverter({
    currency: filters.currency,
    apiSeries,
  });

  const { tableData, selectedItemNames, setSelectedItemNames } = useRoiTable({
    filters,
    analysisRequested,
    convertPrice,
    apiSeries,
  });

  const { chartData } = useChartSeries({
    selectedItemNames,
    apiSeries,
    selectedSourceLeagues: filters.selectedSourceLeagues,
    isKeepersLive,
    convertPrice,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const { sortConfig, handleSort } = useSortConfig();

  const { sortedTableData } = useSortedTableData({
    tableData,
    searchQuery,
    sortConfig,
    convertPrice,
  });

  const toggleItemSelection = (itemName) => {
    setSelectedItemNames((prev) => {
      if (prev.includes(itemName)) return prev.filter((n) => n !== itemName);
      return [...prev, itemName];
    });
  };

  const toggleSelectAll = (shouldSelectAll) => {
    if (shouldSelectAll) {
      setSelectedItemNames(sortedTableData.map(item => item.name));
    } else {
      setSelectedItemNames([]);
    }
  };

  // --- Resizable Layout Logic ---
  const [chartHeight, setChartHeight] = useState(480);
  const isResizingRef = useRef(false);
  const containerRef = useRef(null);

  const startResizing = useCallback(() => {
    isResizingRef.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  const stopResizing = useCallback(() => {
    isResizingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const resize = useCallback((e) => {
    if (!isResizingRef.current || !containerRef.current) return;
    
    // Calculate new height relative to container top
    const containerRect = containerRef.current.getBoundingClientRect();
    const newHeight = e.clientY - containerRect.top - 80; // Approximate header offset if needed, or just relative
    // Actually simpler: e.clientY relative to Chart top? 
    // Let's use simpler delta or just absolute position if we know where chart starts.
    // Chart starts at top of dashboard (padding included).
    // Let's rely on e.clientY minus offset from top of viewport to top of dashboard.
    
    const offsetTop = containerRect.top; 
    const h = e.clientY - offsetTop; // This includes the top ChartRangeBar area effectively

    // Clamp height (min 200px, max container height - 200px)
    const minH = 200;
    const maxH = containerRect.height - 150; 
    
    setChartHeight(Math.max(minH, Math.min(maxH, h)));
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);


  return (
    <div className="h-full w-full overflow-hidden p-4 flex flex-col relative" ref={containerRef}>
      {apiError && (
        <div className="alert alert-error shadow-lg mb-2 flex-none">
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

      {/* --- Top Pane: Chart --- */}
      {/* ChartRangeBar is fixed height, Chart takes remaining of 'chartHeight' */}
      <div 
        className="flex flex-col gap-2 flex-none" 
        style={{ height: chartHeight }}
      >
        <div className="flex-none">
          <ChartRangeBar
            isKeepersLive={isKeepersLive}
            windowPreset={windowPreset}
            setWindowPreset={setWindowPreset}
            windowMax={windowMax}
            dayRange={dayRange}
            setDayRange={setDayRange}
          />
        </div>

        <div className="flex-1 min-h-0">
           {/* PriceChart container needs to fill this flex-1 area. 
               We pass height to PriceChart, but better to let it fill parent.
               Wait, PriceChart expects specific pixel height for D3?
               Yes, we modified PriceChart to accept 'height' prop and use it for ChartViewport.
               However, if PriceChart is flex-1, we can use ResizeObserver inside PriceChart...
               But we already implemented explicit height prop logic.
               Let's pass the calculated height.
               Actually, 'chartHeight' is the total height of this top pane.
               Height for PriceChart = chartHeight - ChartRangeBar height (approx 50px) - gap (8px).
           */}
           <PriceChart
              data={chartData}
              selectedItemNames={selectedItemNames}
              filters={filters}
              dayRange={dayRange}
              colorDomain={processedChartData.map((d) => d.name)}
              height={Math.max(100, chartHeight - 60)} // Approximate remaining height
            />
        </div>
      </div>

      {/* --- Resize Handle --- */}
      <div
        className={[
          "flex-none h-3 cursor-row-resize flex items-center justify-center group relative",
          "transition-all duration-200 -mx-4 px-4 my-0.5",
          "hover:bg-amber-500/5 active:bg-amber-500/10"
        ].join(" ")}
        onMouseDown={startResizing}
      >
        {/* Horizontal Line across the width */}
        <div className="absolute inset-x-0 h-[1px] bg-base-content/5 group-hover:bg-amber-500/20" />
        
        {/* Centered Handle Indicator */}
        <div className={[
            "w-20 h-1 rounded-full flex items-center justify-center gap-1 transition-all",
            "bg-base-300 border border-white/5 shadow-lg group-hover:w-28 group-hover:bg-base-100 group-hover:border-amber-500/30"
          ].join(" ")}
        >
          {/* Grip dots (slimmer) */}
          <div className="w-0.5 h-0.5 rounded-full bg-base-content/20 group-hover:bg-amber-500/50" />
          <div className="w-0.5 h-0.5 rounded-full bg-base-content/20 group-hover:bg-amber-500/50" />
          <div className="w-0.5 h-0.5 rounded-full bg-base-content/20 group-hover:bg-amber-500/50" />
        </div>

        {/* Label (visible on hover) */}
        <div className="absolute right-8 text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none">
          Resize
        </div>
      </div>

      {/* --- Bottom Pane: Table --- */}
      <div className="flex-1 min-h-0 flex flex-col bg-base-200 rounded-lg shadow-xl overflow-hidden border border-white/5">
          {/* Header */}
          <div className="shrink-0">
            <TableHeaderBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onClear={() => setSelectedItemNames([])}
              onSelectTop5={() =>
                setSelectedItemNames(sortedTableData.slice(0, 5).map((i) => i.name))
              }
            />
          </div>

          {/* Table Body */}
          <div className="flex-1 min-h-0 overflow-auto">
            <ItemTable
              data={sortedTableData}
              selectedItems={selectedItemNames}
              onToggleItem={toggleItemSelection}
              onSelectAll={toggleSelectAll}
              selectedSourceLeagues={filters.selectedSourceLeagues}
              filters={filters}
              convertPrice={convertPrice}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </div>
      </div>

      <LoadingOverlay isLoading={isLoading} />
    </div>
  );
};

export default Dashboard;
