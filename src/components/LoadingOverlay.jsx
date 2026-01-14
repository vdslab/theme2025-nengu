import React from "react";

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-base-100/50 backdrop-blur-sm rounded-lg">
      <div className="flex flex-col items-center gap-2">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="text-sm font-semibold opacity-80 animate-pulse">
          Fetching poe.ninja data...
        </span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
