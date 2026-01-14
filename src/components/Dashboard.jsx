import React, { useState } from "react";
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
        <ChartRangeBar
          isKeepersLive={isKeepersLive}
          windowPreset={windowPreset}
          setWindowPreset={setWindowPreset}
          windowMax={windowMax}
          dayRange={dayRange}
          setDayRange={setDayRange}
        />

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
        <TableHeaderBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClear={() => setSelectedItemNames([])}
          onSelectTop5={() =>
            setSelectedItemNames(sortedTableData.slice(0, 5).map((i) => i.name))
          }
        />

        <div className="flex-1 overflow-auto relative">
          <ItemTable
            data={sortedTableData}
            selectedItems={selectedItemNames}
            onToggleItem={toggleItemSelection}
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
