import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

function App() {
  const [filters, setFilters] = useState({
    buyDay: 3,
    sellDay: 14,
    minPrice: '',
    maxPrice: '',
    showHighlight: true,
  });

  // This state will trigger the analysis when true
  const [analysisRequested, setAnalysisRequested] = useState(true);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Reset analysis request on filter change, analysis will run on button click
    setAnalysisRequested(false);
  };
  
  const handleAnalyze = () => {
    setAnalysisRequested(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <aside className="w-64 h-screen sticky top-0">
        <Sidebar 
          filters={filters} 
          onFilterChange={handleFilterChange}
          onAnalyze={handleAnalyze}
        />
      </aside>
      <main className="flex-1 h-screen overflow-y-auto">
        <Dashboard 
            filters={filters} 
            analysisRequested={analysisRequested} 
        />
      </main>
    </div>
  );
}

export default App;
