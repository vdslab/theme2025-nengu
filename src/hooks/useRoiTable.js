import { useEffect, useState, useMemo, useRef } from "react";
import { processedChartData, availableLeagues } from "../data/processedData.js";

export const useRoiTable = ({ filters, analysisRequested, convertPrice, apiSeries = [] }) => {
  // tableData is derived from filters/data, so useMemo is appropriate
  const tableData = useMemo(() => {
    // if (!analysisRequested) return []; // Removed to allow instant updates based on filters

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

    // Create a map for quick API data lookup: item name -> league -> values
    // Also capture icon if available in API data
    const apiDataMap = new Map();
    const apiIcons = new Map();

    apiSeries.forEach(s => {
        if (!apiDataMap.has(s.name)) {
            apiDataMap.set(s.name, {});
        }
        const leagueName = s.league || "Keepers";
        apiDataMap.get(s.name)[leagueName] = s.values;
        if (s.icon) apiIcons.set(s.name, s.icon);
    });

    // Create a map for static data
    const staticDataMap = new Map();
    processedChartData.forEach(d => staticDataMap.set(d.name, d));

    // Combine all unique item names from both sources
    const allItemNames = new Set([...staticDataMap.keys(), ...apiDataMap.keys()]);

    const results = Array.from(allItemNames)
      .map((itemName) => {
        const staticItem = staticDataMap.get(itemName);
        
        // Determine icon: static > api > default
        const icon = staticItem?.icon || apiIcons.get(itemName) || "";

        // Default values from static data (if available)
        let targetValues = staticItem?.values; 
        let leagues = staticItem?.leagues;
        let actualLeague = "Average";

        if (!useAverage) {
            // Try to find data in static leagues
            if (leagues && leagues[primaryLeague]) {
                targetValues = leagues[primaryLeague];
                actualLeague = primaryLeague;
            } 
            // If not found, check API data
            else if (apiDataMap.has(itemName) && apiDataMap.get(itemName)[primaryLeague]) {
                targetValues = apiDataMap.get(itemName)[primaryLeague];
                actualLeague = primaryLeague;
            }
            else {
                // If selected league data is missing for this item, skip it
                return null;
            }
        } else {
             // If useAverage is true but staticItem is missing (new item only in API?), 
             // we can't easily calculate "Average" unless we treat the single API league as average?
             // For now, if it's only in API and we want "Average", we might skip or use what we have.
             // Existing logic relied on staticItem.values.
             if (!targetValues && apiDataMap.has(itemName)) {
                 // Fallback: if we only have API data, use the first available league as "Average" proxy?
                 // Or just skip. Let's skip to be safe, or check if API has "Average" (unlikely).
                 // Actually, if user selects "Average", they expect historical average. 
                 // If item is new, it has no history. So skipping is correct.
                 if (!staticItem) return null;
             }
        }

        const rawBuy = findPriceForDay(targetValues, buyDay);
        const rawSell = findPriceForDay(targetValues, sellDay);

        const buyPrice = rawBuy !== null ? convertPrice(rawBuy, buyDay, actualLeague) : null;
        const sellPrice = rawSell !== null ? convertPrice(rawSell, sellDay, actualLeague) : null;

        // Calculate Risk (Standard Deviation of ROI across all available leagues)
        let risk = null;
        if (leagues) {
          const rois = availableLeagues
            .map(league => {
              const leagueValues = leagues[league];
              const lBuy = findPriceForDay(leagueValues, buyDay);
              const lSell = findPriceForDay(leagueValues, sellDay);
              
              if (lBuy !== null && lSell !== null && lBuy > 0) {
                 return (lSell - lBuy) / lBuy;
              }
              return null;
            })
            .filter(val => val !== null);

          if (rois.length > 1) { 
            const mean = rois.reduce((a, b) => a + b, 0) / rois.length;
            const variance = rois.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rois.length;
            risk = Math.sqrt(variance);
          } else if (rois.length === 1) {
             risk = 0; 
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
            name: itemName,
            icon: icon,
            buyPrice,
            sellPrice,
            roi,
            risk, 
            buyDay,
            sellDay,
            values: targetValues,
            leagues: leagues,
          };
        }

        return null;
      })
      .filter(Boolean);

    return results.sort((a, b) => b.roi - a.roi);
  }, [filters, analysisRequested, convertPrice, apiSeries]);

  const [selectedItemNames, setSelectedItemNames] = useState([]);
  const hasLoadedRef = useRef(false);

  // When tableData changes (e.g. filters changed), preserve selection if possible
  useEffect(() => {
    const timer = setTimeout(() => {
      // If no data, do nothing (keep previous selection until data returns)
      if (!tableData || tableData.length === 0) {
        return;
      }

      // Initial load: select top 5
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        setSelectedItemNames(tableData.slice(0, 5).map((r) => r.name));
      } else {
        // Subsequent updates: keep valid selections
        setSelectedItemNames((prevSelected) => {
          const newDataNames = new Set(tableData.map((d) => d.name));
          const stillValidSelection = prevSelected.filter((name) => newDataNames.has(name));
          
          // Bailout if selection hasn't changed
          if (
            prevSelected.length === stillValidSelection.length && 
            prevSelected.every((val, index) => val === stillValidSelection[index])
          ) {
            return prevSelected;
          }

          return stillValidSelection;
        });
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
