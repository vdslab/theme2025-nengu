import React from 'react';

const ItemTable = ({ data }) => {
  // `filters` prop might be needed if buy/sell days are dynamic in the header
  // For now, we assume data contains what we need or we derive it.
  const buyDay = data.length > 0 && data[0].buyDay ? data[0].buyDay : 'X';
  const sellDay = data.length > 0 && data[0].sellDay ? data[0].sellDay : 'Y';


  return (
    <div className="bg-base-200 rounded-lg border border-white/10 overflow-hidden mt-4 shadow-xl">
      <div className="p-3 border-b border-white/5 bg-base-300/30 flex justify-between items-center">
         <h3 className="font-bold text-base text-base-content/90">Top Investment Candidates</h3>
         <span className="text-[10px] uppercase tracking-wider opacity-50">Market Trend Analysis</span>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-sm w-full min-w-[600px] border-separate border-spacing-0">
          {/* head */}
          <thead className="bg-base-300/50 text-base-content/70">
            <tr>
              <th className="border-b border-r border-white/5 py-3 font-semibold first:rounded-tl-none">Item Name</th>
              <th className="border-b border-r border-white/5 text-right py-3 font-semibold">Buy Price (Day {buyDay})</th>
              <th className="border-b border-r border-white/5 text-right py-3 font-semibold">Sell Price (Day {sellDay})</th>
              <th className="border-b border-white/5 text-right py-3 font-semibold">Predicted ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data && data.length > 0 ? (
              data.map((item) => (
                <tr key={item.name} className="hover:bg-white/[0.02] transition-colors group">
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
                <td colSpan="4" className="text-center p-12 text-base-content/30 italic">
                  No profitable items found for the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemTable;


