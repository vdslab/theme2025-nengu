import React, { useEffect, useRef, useState } from "react";

const ChartViewport = ({ height = 320, children }) => {
  const containerRef = useRef(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const ro = new ResizeObserver((entries) => {
      if (!entries?.length) return;
      setW(entries[0].contentRect.width);
    });

    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex-none">
      <div
        ref={containerRef}
        className="w-full min-w-0"
        style={{ height }}
      >
        {children({ width: w, height, containerRef })}
      </div>
    </div>
  );
};

export default ChartViewport;
