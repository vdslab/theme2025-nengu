import React from 'react';

const ItemTable = ({ data, selectedItems, onToggleItem }) => {
  const buyDay = data.length > 0 && data[0].buyDay ? data[0].buyDay : 'X';
  const sellDay = data.length > 0 && data[0].sellDay ? data[0].sellDay : 'Y';

  return (
    <table className="table table-sm w-full min-w-[600px] border-separate border-spacing-0">
      <thead className="bg-base-300 text-base-content/70 sticky top-0 z-10 shadow-sm">
        <tr>
          <th className="border-b border-r border-white/5 py-3 w-12 text-center bg-base-300">
            {/* Checkbox Header */}
          </th>
          <th className="border-b border-r border-white/5 py-3 font-semibold first:rounded-tl-none bg-base-300">Item Name</th>
          <th className="border-b border-r border-white/5 text-right py-3 font-semibold bg-base-300">Buy Price (Day {buyDay})</th>
          <th className="border-b border-r border-white/5 text-right py-3 font-semibold bg-base-300">Sell Price (Day {sellDay})</th>
          <th className="border-b border-white/5 text-right py-3 font-semibold bg-base-300">Predicted ROI</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {data && data.length > 0 ? (
          data.map((item) => (
            <tr 
              key={item.name} 
              className="hover:bg-white/[0.05] transition-colors group cursor-pointer"
              onClick={() => onToggleItem(item.name)}
            >
              <td className="border-r border-white/5 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm border-gray-500 bg-black/20 checked:bg-amber-500 checked:border-amber-500 [--chkbg:theme(colors.amber.500)] [--chkfg:black] hover:border-amber-400 transition-all"
                  checked={selectedItems.includes(item.name)}
                  onChange={() => onToggleItem(item.name)}
                />
              </td>
              <td className="border-r border-white/5 py-2.5">
                <div className="flex items-center gap-3">
                  {item.icon && (
                    <div className="avatar">
                        <div className="w-8 h-8 rounded bg-black/40 p-1 ring-1 ring-white/10 group-hover:ring-gold/50 transition-all">
                            <img src={item.icon} alt={item.name} className="object-contain w-full h-full" />
                        </div>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm text-base-content/90">{item.name}</div>
                  </div>
                </div>
              </td>
              <td className="text-right border-r border-white/5 font-mono text-sm text-base-content/80">{item.buyPrice.toFixed(2)}c</td>
              <td className="text-right border-r border-white/5 font-mono text-sm text-base-content/80">{item.sellPrice.toFixed(2)}c</td>
              <td className={`text-right font-bold text-sm ${item.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(item.roi * 100).toFixed(1)}%
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="text-center p-12 text-base-content/30 italic">
              No profitable items found for the selected criteria.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default ItemTable;


