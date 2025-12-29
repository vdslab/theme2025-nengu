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
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-6 text-primary">PoE Market Prophet</h2>
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-4">Investment Settings</h3>
        
        <div className="mb-4">
          <label htmlFor="buyDay" className="block text-sm font-medium mb-1">Buy Day (e.g., Day 3)</label>
          <input type="number" id="buyDay" name="buyDay" value={filters.buyDay} onChange={handleChange} className="input input-bordered input-primary w-full"/>
        </div>

        <div className="mb-4">
          <label htmlFor="sellDay" className="block text-sm font-medium mb-1">Sell Day (e.g., Day 14)</label>
          <input type="number" id="sellDay" name="sellDay" value={filters.sellDay} onChange={handleChange} className="input input-bordered input-primary w-full"/>
        </div>
        
        <div className="mb-6 flex items-center">
            <input type="checkbox" id="showHighlight" name="showHighlight" checked={filters.showHighlight} onChange={handleChange} className="checkbox checkbox-primary" />
            <label htmlFor="showHighlight" className="ml-2 text-sm font-medium">Show Buy/Sell Highlight</label>
        </div>


        <div>
          <h4 className="font-medium mb-2">Budget (Chaos Orbs)</h4>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="minPrice" className="text-sm">Min</label>
            <input type="number" id="minPrice" name="minPrice" value={filters.minPrice} onChange={handleChange} placeholder="e.g., 100" className="input input-bordered input-primary w-2/3" />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="maxPrice" className="text-sm">Max</label>
            <input type="number" id="maxPrice" name="maxPrice" value={filters.maxPrice} onChange={handleChange} placeholder="e.g., 5000" className="input input-bordered input-primary w-2/3" />
          </div>
        </div>
        
        {/* Currency Toggle will be added later */}

      </div>

      <button onClick={onAnalyze} className="btn btn-primary w-full mt-6">
        Analyze
      </button>
    </div>
  );
};

export default Sidebar;
