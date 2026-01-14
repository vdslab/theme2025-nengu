import { useEffect, useState } from "react";
import { processedChartData } from "../data/processedData.js";
import { norm } from "../utils/norm";

export const useChartSeries = ({
  selectedItemNames,
  apiSeries,
  selectedSourceLeagues,
  isKeepersLive,
  convertPrice,
}) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const sourceLeagues = selectedSourceLeagues || [];
    const leaguesToShow =
      sourceLeagues.length > 0 ? sourceLeagues : isKeepersLive ? [] : ["Average"];

    const selectedSet = new Set(selectedItemNames.map(norm));

    const localExpanded = [];
    processedChartData.forEach((item) => {
      if (!selectedSet.has(norm(item.name))) return;

      leaguesToShow.forEach((league) => {
        let values = null;

        if (league === "Average") values = item.values;
        else if (item.leagues && item.leagues[league]) values = item.leagues[league];

        if (values && values.length > 0) {
          const convertedValues = values.map((v) => ({
            ...v,
            price: convertPrice(v.price, v.day, league === "Average" ? "Average" : league),
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

    const apiExpanded =
      Array.isArray(apiSeries) && apiSeries.length > 0
        ? apiSeries
            .filter((s) => selectedSet.has(norm(s.name)))
            .map((s) => {
              const leagueName = s.league || "Keepers";
              const convertedValues = (s.values || []).map((v) => ({
                ...v,
                price: convertPrice(v.price, v.day, leagueName),
              }));
              return { ...s, league: leagueName, values: convertedValues };
            })
        : [];

    setChartData([...apiExpanded, ...localExpanded]);
  }, [selectedItemNames, apiSeries, selectedSourceLeagues, isKeepersLive, convertPrice]);

  return { chartData };
};
