import React from 'react';

const SortIcon = ({ columnKey, sortConfig }) => {
  if (sortConfig?.key !== columnKey) return <span className="opacity-20 ml-1">⇅</span>;
  return <span className="ml-1 text-amber-500">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
};

const Th = ({ label, sortKey, className, style, children, onSort, sortConfig }) => (
  <th 
    className={`${className} cursor-pointer hover:bg-white/10 transition-colors select-none`} 
    style={style}
    onClick={() => onSort && onSort(sortKey)}
  >
      <div className="flex items-center justify-end w-full">
        {children || label}
        <SortIcon columnKey={sortKey} sortConfig={sortConfig} />
      </div>
  </th>
);

const getRiskColor = (risk) => {
  if (risk === null || risk === undefined) return "text-base-content/30";
  // risk is standard deviation of ROI (e.g., 0.1 for 10%)
  // Map 0 -> 0.5 (50%) spread to Green -> Red
  const val = Math.min(Math.max(risk, 0), 0.5); 
  const hue = 120 - (val / 0.5) * 120; 
  return { color: `hsl(${hue}, 80%, 60%)` };
};

const ItemTable = ({ data, selectedItems, onToggleItem, onSelectAll, selectedSourceLeagues, filters, convertPrice, sortConfig, onSort }) => {
  const buyDay = data.length > 0 && data[0].buyDay ? data[0].buyDay : 'X';
  const sellDay = data.length > 0 && data[0].sellDay ? data[0].sellDay : 'Y';
  
  const hasLeagues = selectedSourceLeagues && selectedSourceLeagues.length > 0;
  const unitLabel = filters?.currency === 'divine' ? 'div' : 'c';

  const allSelected = data.length > 0 && data.every(item => selectedItems.includes(item.name));
  const someSelected = data.some(item => selectedItems.includes(item.name)) && !allSelected;

  const getPrice = (values, day) => {
      if (!values || !Array.isArray(values)) return 0;
      const found = values.find(v => v.day === day);
      return found ? found.price : 0;
  };

  return (
    <table className="table table-sm w-full min-w-[600px] border-separate border-spacing-0">
      <thead className="bg-base-300 text-base-content/70 sticky top-0 z-10 shadow-sm">
        <tr>
          <th className="border-b border-r border-white/5 py-3 w-12 text-center bg-base-300">
            <input
              type="checkbox"
              className="checkbox checkbox-sm border-gray-500 bg-black/20 checked:bg-amber-500 checked:border-amber-500 [--chkbg:theme(colors.amber.500)] [--chkfg:black] hover:border-amber-400 transition-all"
              checked={allSelected}
              ref={input => { if (input) input.indeterminate = someSelected; }}
              onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
            />
          </th>
          
          <th 
            className="border-b border-r border-white/5 py-3 font-semibold first:rounded-tl-none bg-base-300 min-w-[200px] cursor-pointer hover:bg-white/10 transition-colors select-none"
            onClick={() => onSort && onSort('name')}
          >
             <div className="flex items-center w-full">
                Item Name
                <SortIcon columnKey="name" sortConfig={sortConfig} />
             </div>
          </th>
          
          {hasLeagues ? (
              selectedSourceLeagues.map(league => (
                  <React.Fragment key={league}>
                      <Th 
                        className="border-b border-r border-white/5 text-right py-3 font-semibold bg-base-300 min-w-[120px] whitespace-nowrap"
                        sortKey={`${league}_buy`}
                        onSort={onSort}
                        sortConfig={sortConfig}
                      >
                          Buy <span className="opacity-50 text-xs ml-1 font-normal">({league === "Average" ? "Avg" : league})</span>
                      </Th>
                      <Th 
                        className="border-b border-r border-white/5 text-right py-3 font-semibold bg-base-300 min-w-[120px] whitespace-nowrap"
                        sortKey={`${league}_sell`}
                        onSort={onSort}
                        sortConfig={sortConfig}
                      >
                          Sell <span className="opacity-50 text-xs ml-1 font-normal">({league === "Average" ? "Avg" : league})</span>
                      </Th>
                      <Th 
                        className="border-b border-r border-white/5 text-right py-3 font-semibold bg-base-300 min-w-[90px] whitespace-nowrap"
                        sortKey={`${league}_roi`}
                        onSort={onSort}
                        sortConfig={sortConfig}
                      >
                          ROI <span className="opacity-50 text-xs ml-1 font-normal">({league === "Average" ? "Avg" : league})</span>
                      </Th>
                  </React.Fragment>
              ))
          ) : (
              <>
                <Th 
                  className="border-b border-r border-white/5 text-right py-3 font-semibold bg-base-300" 
                  sortKey="buyPrice"
                  onSort={onSort}
                  sortConfig={sortConfig}
                >
                    Buy Price (Day {buyDay})
                </Th>
                <Th 
                  className="border-b border-r border-white/5 text-right py-3 font-semibold bg-base-300" 
                  sortKey="sellPrice"
                  onSort={onSort}
                  sortConfig={sortConfig}
                >
                    Sell Price (Day {sellDay})
                </Th>
                <Th 
                  className="border-b border-r border-white/5 text-right py-3 font-semibold bg-base-300" 
                  sortKey="roi"
                  onSort={onSort}
                  sortConfig={sortConfig}
                >
                    Predicted ROI
                </Th>
              </>
          )}

          <Th 
            className="border-b border-white/5 text-right py-3 font-semibold bg-base-300 min-w-[80px]" 
            sortKey="risk"
            onSort={onSort}
            sortConfig={sortConfig}
          >
              Risk
          </Th>
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
              
              {hasLeagues ? (
                  selectedSourceLeagues.map(league => {
                      let leagueValues = [];
                      if (league === "Average") {
                          leagueValues = item.values || [];
                      } else {
                          leagueValues = item.leagues ? item.leagues[league] : [];
                      }

                      const rawBPrice = getPrice(leagueValues, item.buyDay);
                      const rawSPrice = getPrice(leagueValues, item.sellDay);
                      
                      // Convert if helper is available
                      const bPrice = convertPrice ? convertPrice(rawBPrice, item.buyDay, league) : rawBPrice;
                      const sPrice = convertPrice ? convertPrice(rawSPrice, item.sellDay, league) : rawSPrice;

                      const lRoi = bPrice > 0 ? (sPrice - bPrice) / bPrice : 0;
                      
                      return (
                          <React.Fragment key={league}>
                              <td className="text-right border-r border-white/5 font-mono text-sm text-base-content/80">
                                {bPrice > 0 ? bPrice.toFixed(2) : '-'}{unitLabel}
                              </td>
                              <td className="text-right border-r border-white/5 font-mono text-sm text-base-content/80">
                                {sPrice > 0 ? sPrice.toFixed(2) : '-'}{unitLabel}
                              </td>
                              <td className={`text-right border-r border-white/5 font-bold text-sm ${lRoi > 0 ? 'text-green-400' : lRoi < 0 ? 'text-red-400' : 'text-base-content/50'}`}>
                                {bPrice > 0 ? (lRoi * 100).toFixed(1) + '%' : '-'}
                              </td>
                          </React.Fragment>
                      );
                  })
              ) : (
                  <>
                    <td className="text-right border-r border-white/5 font-mono text-sm text-base-content/80">{item.buyPrice.toFixed(2)}{unitLabel}</td>
                    <td className="text-right border-r border-white/5 font-mono text-sm text-base-content/80">{item.sellPrice.toFixed(2)}{unitLabel}</td>
                    <td className={`text-right border-r border-white/5 font-bold text-sm ${item.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(item.roi * 100).toFixed(1)}%
                    </td>
                  </>
              )}

              {/* Risk Column */}
              <td 
                className="text-right font-bold text-sm font-mono border-l border-white/5 bg-black/10"
                style={typeof getRiskColor(item.risk) === 'object' ? getRiskColor(item.risk) : {}}
              >
                  {item.risk !== null && item.risk !== undefined ? `±${(item.risk * 100).toFixed(1)}%` : '-'}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={hasLeagues ? 3 + (selectedSourceLeagues.length * 3) : 6} className="text-center p-12 text-base-content/30 italic">
              No profitable items found for the selected criteria.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default ItemTable;