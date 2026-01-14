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
}) => {
  const ref = useRef(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState({ left: 0, top: 0 });

  // Tooltip の実サイズを計測（内容が変わったら再計測）
  useLayoutEffect(() => {
    if (!visible) return;
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    setSize({ w: rect.width, h: rect.height });
  }, [visible, name, icon, day, price, league, roi, unit]);

  useEffect(() => {
    if (!visible) return;
    if (!ref.current) return;

    // absolute の基準になっている親（PriceChart の containerRef であることが多い）
    const parent = ref.current.offsetParent;
    const parentW = parent?.clientWidth ?? 0;
    const parentH = parent?.clientHeight ?? 0;

    // 親サイズが取れない場合は、無理せず従来位置
    if (!parentW || !parentH) {
      setPos({ left: x + 15, top: y - 15 });
      return;
    }

    const pad = 8;
    const offsetX = 15;
    const offsetY = 15;

    // まずは「右に出す / 上に出す」案
    let left = x + offsetX;
    let top = y - offsetY - size.h; // 上に出す（今までの挙動）

    // 右に見切れるなら左に反転
    if (left + size.w + pad > parentW) {
      left = x - offsetX - size.w;
    }

    // 左に見切れるなら右に戻す（それでもダメならクランプ）
    if (left < pad) {
      left = x + offsetX;
    }

    // 上に見切れるなら下に反転
    if (top < pad) {
      top = y + offsetY;
    }

    // 最終クランプ（親コンテナ内に必ず収める）
    const clampedLeft = clamp(left, pad, parentW - size.w - pad);
    const clampedTop = clamp(top, pad, parentH - size.h - pad);

    setPos({ left: clampedLeft, top: clampedTop });
  }, [visible, x, y, size.w, size.h]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute z-50 bg-black/90 text-white text-sm p-3 rounded-lg shadow-xl border border-white/20 backdrop-blur-sm"
      style={{
        left: pos.left,
        top: pos.top,
        whiteSpace: "nowrap",
      }}
    >
      <div className="flex items-center gap-3 mb-2 border-b border-white/10 pb-2">
        {icon && (
          <div className="w-8 h-8 flex-shrink-0 bg-black/50 rounded p-0.5 border border-white/10">
            <img src={icon} alt="" className="w-full h-full object-contain" />
          </div>
        )}
        <div>
          <div className="font-bold text-amber-400 text-base leading-tight">
            {name}
          </div>
          {league && (
            <div className="text-xs opacity-60 font-mono mt-0.5">{league}</div>
          )}
        </div>
      </div>

      <div className="space-y-1 text-xs font-mono">
        <div className="flex justify-between gap-4">
          <span className="opacity-60">Time:</span>
          <span className="font-bold">Day {day}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="opacity-60">Price:</span>
          <span className="text-amber-200">
            {price?.toFixed(2)} {unit}
          </span>
        </div>
        {roi !== null && roi !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="opacity-60">ROI:</span>
            <span
              className={
                roi > 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"
              }
            >
              {roi > 0 ? "+" : ""}
              {roi.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tooltip;
