import React from 'react';

const Sidebar = ({ filters, onFilterChange, onAnalyze }) => {

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onFilterChange({
      ...filters,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div className="bg-gray-800 text-white p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-6 text-yellow-400">PoE Market Prophet</h2>
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-4">Investment Settings</h3>
        
        <div className="mb-4">
          <label htmlFor="buyDay" className="block text-sm font-medium mb-1">Buy Day (e.g., Day 3)</label>
          <input type="number" id="buyDay" name="buyDay" value={filters.buyDay} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"/>
        </div>

        <div className="mb-4">
          <label htmlFor="sellDay" className="block text-sm font-medium mb-1">Sell Day (e.g., Day 14)</label>
          <input type="number" id="sellDay" name="sellDay" value={filters.sellDay} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"/>
        </div>
        
        <div className="mb-6 flex items-center">
            <input type="checkbox" id="showHighlight" name="showHighlight" checked={filters.showHighlight} onChange={handleChange} className="h-4 w-4 bg-gray-700 border-gray-600 rounded text-yellow-500 focus:ring-yellow-500" />
            <label htmlFor="showHighlight" className="ml-2 text-sm font-medium">Show Buy/Sell Highlight</label>
        </div>


        <div>
          <h4 className="font-medium mb-2">Budget (Chaos Orbs)</h4>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="minPrice" className="text-sm">Min</label>
            <input type="number" id="minPrice" name="minPrice" value={filters.minPrice} onChange={handleChange} placeholder="e.g., 100" className="w-2/3 bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="maxPrice" className="text-sm">Max</label>
            <input type="number" id="maxPrice" name="maxPrice" value={filters.maxPrice} onChange={handleChange} placeholder="e.g., 5000" className="w-2/3 bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
        </div>
        
        {/* Currency Toggle will be added later */}

      </div>

      <button onClick={onAnalyze} className="w-full bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-2 px-4 rounded-md transition duration-300 mt-6 disabled:bg-gray-500 disabled:cursor-not-allowed">
        Analyze
      </button>
    </div>
  );
};

export default Sidebar;
