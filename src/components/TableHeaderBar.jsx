import React from "react";

const TableHeaderBar = ({
  searchQuery,
  setSearchQuery,
  onClear,
  onSelectTop5,
}) => {
  return (
    <div className="p-3 border-b border-white/5 bg-base-300/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
      <div>
        <h3 className="font-bold text-base text-base-content/90">Top Candidates</h3>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search items..."
          className="input input-sm input-bordered bg-base-100 border-white/10 w-48 focus:w-64 transition-all focus:border-amber-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="h-4 w-px bg-white/10 mx-1" />
        <div className="flex items-center gap-2">
          <button
            className="btn btn-xs sm:btn-sm bg-base-100 border-2 border-red-900/50 text-red-400 hover:bg-red-900 hover:text-white hover:border-red-600 min-w-[70px] transition-all"
            onClick={onClear}
            type="button"
          >
            Clear
          </button>
          <button
            className="btn btn-xs sm:btn-sm bg-base-100 border-2 border-amber-900/50 text-amber-500 hover:bg-amber-700 hover:text-black hover:border-amber-500 min-w-[120px] transition-all"
            onClick={onSelectTop5}
            type="button"
          >
            Select Top 5
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableHeaderBar;
