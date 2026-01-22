import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const Tooltip = ({
  visible,
  x,
  y,
  name,
  icon,
  day,
  price,
  league,
  roi,
  unit = "c",
  riskStd = null, // 追加
}) => {
  const ref = useRef(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!visible) return;
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    setSize({ w: rect.width, h: rect.height });
  }, [visible, name, icon, day, price, league, roi, unit, riskStd]);

  useEffect(() => {
    if (!visible) return;
    if (!ref.current) return;

    const parent = ref.current.offsetParent;
    const parentW = parent?.clientWidth ?? 0;
    const parentH = parent?.clientHeight ?? 0;

    if (!parentW || !parentH) {
      setPos({ left: x + 15, top: y - 15 });
      return;
    }

    const pad = 8;
    const offsetX = 15;
    const offsetY = 15;

    let left = x + offsetX;
    let top = y - offsetY - size.h;

    if (left + size.w + pad > parentW) left = x - offsetX - size.w;
    if (left < pad) left = x + offsetX;
    if (top < pad) top = y + offsetY;

    setPos({
      left: clamp(left, pad, parentW - size.w - pad),
      top: clamp(top, pad, parentH - size.h - pad),
    });
  }, [visible, x, y, size.w, size.h]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute z-50 bg-black/90 text-white text-sm p-3 rounded-lg shadow-xl border border-white/20 backdrop-blur-sm"
      style={{ left: pos.left, top: pos.top, whiteSpace: "nowrap" }}
    >
      <div className="flex items-center gap-3 mb-2 border-b border-white/10 pb-2">
        {icon && (
          <div className="w-8 h-8 flex-shrink-0 bg-black/50 rounded p-0.5 border border-white/10">
            <img src={icon} alt="" className="w-full h-full object-contain" />
          </div>
        )}
        <div>
          <div className="font-bold text-amber-400 text-base leading-tight">{name}</div>
          {league && <div className="text-xs opacity-60 font-mono mt-0.5">{league}</div>}
        </div>
      </div>

      <div className="space-y-1 text-xs font-mono">
        <div className="flex justify-between gap-4">
          <span className="opacity-60">Time:</span>
          <span className="font-bold">{day}</span>
        </div>

        {price !== null && price !== undefined && Number.isFinite(price) && (
          <div className="flex justify-between gap-4">
            <span className="opacity-60">Price:</span>
            <span className="text-amber-200">
              {Number(price).toFixed(2)} {unit}
            </span>
          </div>
        )}

        {roi !== null && roi !== undefined && Number.isFinite(roi) && (
          <div className="flex justify-between gap-4">
            <span className="opacity-60">ROI:</span>
            <span className={roi > 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
              {roi > 0 ? "+" : ""}
              {Number(roi).toFixed(1)}%
            </span>
          </div>
        )}

        {riskStd !== null && riskStd !== undefined && Number.isFinite(riskStd) && (
          <div className="flex justify-between gap-4">
            <span className="opacity-60">Risk σ:</span>
            <span className="text-sky-200 font-bold">{Number(riskStd).toFixed(2)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tooltip;
