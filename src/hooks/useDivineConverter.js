import { useCallback, useMemo } from "react";
import { processedChartData } from "../data/processedData.js";
import { norm } from "../utils/norm";

export const useDivineConverter = ({ currency, apiSeries }) => {
  const localDivine = useMemo(
    () => processedChartData.find((i) => norm(i.name) === "divineorb"),
    []
  );

  const getDivinePrice = useCallback(
    (day, league) => {
      // Live(Keepers) を優先
      if (
        league === "Keepers" ||
        (apiSeries.length > 0 && apiSeries[0].league === league)
      ) {
        const liveDiv = apiSeries.find((i) => norm(i.name) === "divineorb");
        if (liveDiv) {
          const p = liveDiv.values.find((v) => v.day === day)?.price;
          if (p) return p;
        }
      }

      // Local fallback
      if (localDivine) {
        let series = [];
        if (league === "Average") series = localDivine.values;
        else if (localDivine.leagues && localDivine.leagues[league]) {
          series = localDivine.leagues[league];
        }

        const p = series.find((v) => v.day === day)?.price;
        if (p) return p;
      }

      return null;
    },
    [apiSeries, localDivine]
  );

  const convertPrice = useCallback(
    (chaosPrice, day, league) => {
      if (currency !== "divine") return chaosPrice;
      const divPrice = getDivinePrice(day, league);
      if (!divPrice || divPrice === 0) return 0;
      return chaosPrice / divPrice;
    },
    [currency, getDivinePrice]
  );

  return { getDivinePrice, convertPrice };
};
