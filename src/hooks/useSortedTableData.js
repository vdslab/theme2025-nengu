import { useMemo, useState } from "react";

export const useSortConfig = () => {
  const [sortConfig, setSortConfig] = useState({ key: "roi", direction: "desc" });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "desc" };
    });
  };

  return { sortConfig, handleSort };
};

export const useSortedTableData = ({ tableData, searchQuery, sortConfig, convertPrice }) => {
  const filteredTableData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tableData.filter((item) => item.name.toLowerCase().includes(q));
  }, [tableData, searchQuery]);

  const sortedTableData = useMemo(() => {
    let data = [...filteredTableData];
    if (!sortConfig.key) return data;

    const { key, direction } = sortConfig;
    const isAsc = direction === "asc";

    data.sort((a, b) => {
      let valA;
      let valB;

      if (key === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (["buyPrice", "sellPrice", "roi"].includes(key)) {
        valA = a[key] ?? -Infinity;
        valB = b[key] ?? -Infinity;
      } else {
        // Dynamic keys: "Mercenaries_buy" / "Average_roi" など
        const parts = key.split("_");
        const type = parts.pop(); // buy | sell | roi
        const league = parts.join("_");

        const getRaw = (item) => {
          let values = [];
          if (league === "Average") values = item.values || [];
          else values = item.leagues ? item.leagues[league] : [];

          const day = type === "buy" ? item.buyDay : item.sellDay;
          const found = values?.find((v) => v.day === day);
          return found ? found.price : 0;
        };

        const rawA = getRaw(a);
        const rawB = getRaw(b);

        if (type === "roi") {
          const getRoi = (item) => {
            let vs = [];
            if (league === "Average") vs = item.values || [];
            else vs = item.leagues ? item.leagues[league] : [];

            const rb = vs?.find((v) => v.day === item.buyDay)?.price || 0;
            const rs = vs?.find((v) => v.day === item.sellDay)?.price || 0;

            const cb = convertPrice(rb, item.buyDay, league);
            const cs = convertPrice(rs, item.sellDay, league);
            return cb > 0 ? (cs - cb) / cb : -9999;
          };

          valA = getRoi(a);
          valB = getRoi(b);
        } else {
          valA = convertPrice(rawA, type === "buy" ? a.buyDay : a.sellDay, league);
          valB = convertPrice(rawB, type === "buy" ? b.buyDay : b.sellDay, league);
        }
      }

      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
    });

    return data;
  }, [filteredTableData, sortConfig, convertPrice]);

  return { filteredTableData, sortedTableData };
};
