import React from 'react';

const ItemTable = ({ data }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg mt-4">
      <h3 className="text-lg font-bold text-white mb-2">Top 10 Investment Candidates</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-white min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2">Item Name</th>
              <th className="text-left p-2">Buy Price (Day {data.length > 0 ? data[0].buyDay : 'X'})</th>
              <th className="text-left p-2">Sell Price (Day {data.length > 0 ? data[0].sellDay : 'Y'})</th>
              <th className="text-left p-2">Predicted ROI</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item) => (
                <tr key={item.name} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">{item.buyPrice.toFixed(2)}c</td>
                  <td className="p-2">{item.sellPrice.toFixed(2)}c</td>
                  <td className={`p-2 font-bold ${item.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(item.roi * 100).toFixed(1)}%
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center p-4 text-gray-400">
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
