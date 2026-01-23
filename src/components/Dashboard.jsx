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

  const toggleSelectAll = (shouldSelectAll) => {
    if (shouldSelectAll) {
      setSelectedItemNames(sortedTableData.map(item => item.name));
    } else {
      setSelectedItemNames([]);
    }
  };

  return (
    // ✅ 右側全体をスクロール可能にする
    <div className="h-full overflow-y-auto p-4">
      <div className="min-h-full flex flex-col gap-4 relative">
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
        <div className="flex flex-col gap-2">
          <ChartRangeBar
            isKeepersLive={isKeepersLive}
            windowPreset={windowPreset}
            setWindowPreset={setWindowPreset}
            windowMax={windowMax}
            dayRange={dayRange}
            setDayRange={setDayRange}
          />

          <div className="bg-base-200 rounded-lg shadow-inner overflow-hidden">
            <PriceChart
              data={chartData}
              selectedItemNames={selectedItemNames}
              filters={filters}
              dayRange={dayRange}
              colorDomain={processedChartData.map((d) => d.name)}
            />
          </div>
        </div>

        {/* --- Table --- */}
        {/* ✅ テーブルは潰れないように “最大高さ” を持たせる（中身は個別スクロール） */}
        <div
          className={[
            "bg-base-200 rounded-lg shadow-xl overflow-hidden border border-white/5",
            "flex flex-col",
          ].join(" ")}
          style={{
            // 画面サイズに応じていい感じに（ここは好みで調整OK）
            maxHeight: "min(560px, 60vh)",
          }}
        >
          {/* ヘッダー固定 */}
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

          {/* ✅ テーブル本体だけスクロール */}
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
    </div>
  );
};

export default Dashboard;
