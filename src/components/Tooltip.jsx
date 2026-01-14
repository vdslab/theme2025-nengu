import React from "react";

const Tooltip = ({ visible, x, y, name, icon, day, price, league, roi, unit = "c" }) => {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute z-50 bg-black/90 text-white text-sm p-3 rounded-lg shadow-xl border border-white/20 backdrop-blur-sm"
      style={{
        left: x + 15,
        top: y - 15,
        transform: "translate(0, -100%)",
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
            <div className="font-bold text-amber-400 text-base leading-tight">{name}</div>
            {league && <div className="text-xs opacity-60 font-mono mt-0.5">{league}</div>}
          </div>
      </div>
      
      <div className="space-y-1 text-xs font-mono">
          <div className="flex justify-between gap-4">
              <span className="opacity-60">Time:</span>
              <span className="font-bold">{day}</span>
          </div>
          <div className="flex justify-between gap-4">
              <span className="opacity-60">Price:</span>
              <span className="text-amber-200">{price?.toFixed(2)} {unit}</span>
          </div>
          {roi !== null && roi !== undefined && (
             <div className="flex justify-between gap-4">
                <span className="opacity-60">ROI:</span>
                <span className={roi > 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                    {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                </span>
             </div>
          )}
      </div>
    </div>
  );
};

export default Tooltip;
