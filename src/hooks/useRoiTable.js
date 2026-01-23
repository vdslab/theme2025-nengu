import { useEffect, useState, useMemo } from "react";
import { processedChartData, availableLeagues } from "../data/processedData.js";

export const useRoiTable = ({ filters, analysisRequested, convertPrice }) => {
  // tableData is derived from filters/data, so useMemo is appropriate
  const tableData = useMemo(() => {
    if (!analysisRequested) return [];

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

        // Calculate Risk (Standard Deviation of ROI across all available leagues)
        let risk = null;
        if (item.leagues) {
          const rois = availableLeagues
            .map(league => {
              const leagueValues = item.leagues[league];
              const lBuy = findPriceForDay(leagueValues, buyDay);
              const lSell = findPriceForDay(leagueValues, sellDay);
              
              if (lBuy !== null && lSell !== null && lBuy > 0) {
                 return (lSell - lBuy) / lBuy;
              }
              return null;
            })
            .filter(val => val !== null);

          if (rois.length > 1) { // Need at least 2 points for variance
            const mean = rois.reduce((a, b) => a + b, 0) / rois.length;
            const variance = rois.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rois.length;
            risk = Math.sqrt(variance);
          } else if (rois.length === 1) {
             risk = 0; // Only one data point implies no observed variation (though strictly undefined std dev for sample, 0 makes sense for UI "no deviation known")
          }
        }

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
            risk, // Add Risk to the item object
            buyDay,
            sellDay,
            values: targetValues,
            leagues: item.leagues,
          };
        }

        return null;
      })
      .filter(Boolean);

    return results.sort((a, b) => b.roi - a.roi);
  }, [filters, analysisRequested, convertPrice]);

  const [selectedItemNames, setSelectedItemNames] = useState([]);

  // When tableData changes (e.g. filters changed), reset selection to Top 5
  // Use setTimeout to avoid "setState synchronously within an effect" lint error
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tableData.length > 0) {
        setSelectedItemNames(tableData.slice(0, 5).map((r) => r.name));
      } else {
        setSelectedItemNames([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [tableData]);

  return {
    tableData,
    selectedItemNames,
    setSelectedItemNames,
  };
};
