import { useEffect, useState } from "react";
import { processedChartData } from "../data/processedData.js";

export const useRoiTable = ({ filters, analysisRequested, convertPrice }) => {
  const [tableData, setTableData] = useState([]);
  const [selectedItemNames, setSelectedItemNames] = useState([]);

  useEffect(() => {
    if (!analysisRequested) return;

    const findPriceForDay = (values, day) => {
      if (!Array.isArray(values)) return null;
      const found = values.find((v) => v.day === day);
      return found ? found.price : null;
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

        const rawBuy = findPriceForDay(targetValues, buyDay);
        const rawSell = findPriceForDay(targetValues, sellDay);

        const buyPrice = rawBuy !== null ? convertPrice(rawBuy, buyDay, actualLeague) : null;
        const sellPrice = rawSell !== null ? convertPrice(rawSell, sellDay, actualLeague) : null;

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
            values: targetValues,
            leagues: item.leagues,
          };
        }

        return null;
      })
      .filter(Boolean);

    const sorted = results.sort((a, b) => b.roi - a.roi);
    setTableData(sorted);

    // 初期選択：Top5
    setSelectedItemNames(sorted.slice(0, 5).map((r) => r.name));
  }, [filters, analysisRequested, convertPrice]);

  return {
    tableData,
    selectedItemNames,
    setSelectedItemNames,
  };
};
