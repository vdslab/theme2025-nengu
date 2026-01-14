import { useEffect, useMemo, useState } from "react";

export const useWindowRange = (compareLeagues) => {
  const isKeepersLive = String(compareLeagues ?? "").trim() === "Keepers";

  const [windowPreset, setWindowPreset] = useState("30d"); // "7d" | "30d"

  const windowMax = useMemo(() => {
    if (isKeepersLive) return 7;
    return windowPreset === "7d" ? 7 : 30;
  }, [isKeepersLive, windowPreset]);

  const [dayRange, setDayRange] = useState([1, windowMax]);

  // Keepers ON の瞬間に 7d 固定
  useEffect(() => {
    if (isKeepersLive) setWindowPreset("7d");
  }, [isKeepersLive]);

  // windowMax が変わったら範囲をリセット
  useEffect(() => {
    setDayRange([1, windowMax]);
  }, [windowMax]);

  // dayRange をクランプ（逆転も防ぐ）
  useEffect(() => {
    setDayRange((prev) => {
      const a = Math.max(1, Math.min(windowMax, prev[0]));
      const b = Math.max(1, Math.min(windowMax, prev[1]));
      return a <= b ? [a, b] : [b, a];
    });
  }, [windowMax]);

  return {
    isKeepersLive,
    windowPreset,
    setWindowPreset,
    windowMax,
    dayRange,
    setDayRange,
  };
};
