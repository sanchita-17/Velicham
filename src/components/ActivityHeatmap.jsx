import React, { useEffect, useState } from 'react';

export default function CriminalHeatmap() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/analytics/heatmap-data")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        // Ensure heatmapData is ALWAYS an array to prevent .slice() runtime crashes
        const grid = Array.isArray(data?.heatmap_grid) 
          ? data.heatmap_grid 
          : Array.isArray(data) 
          ? data 
          : [];
        
        setHeatmapData(grid);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching heatmap data:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-slate-400 p-4 font-mono text-sm">Loading target telemetry...</div>;
  }

  if (error) {
    return (
      <div className="bg-slate-900 p-6 rounded-xl border border-red-900 text-red-400 font-mono text-sm">
        <strong className="block mb-1">Telemetry Connection Error:</strong>
        {error}. Ensure your FastAPI backend is running on port 8000.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-white shadow-lg font-sans">
      <h3 className="text-lg font-semibold mb-1">Dark Web Target Activity Heatmap</h3>
      <p className="text-sm text-slate-400 mb-6">Tracking hourly operational windows (UTC)</p>
      
      {heatmapData.length === 0 ? (
        <div className="text-slate-500 text-sm py-4">No activity records returned from endpoint.</div>
      ) : (
        <div className="grid grid-cols-12 gap-2">
          {heatmapData.slice(0, 24).map((slot, index) => {
            const count = slot?.count || 0;
            const hour = slot?.hour ?? index;
            const day = slot?.day || 'UTC';

            return (
              <div 
                key={index} 
                className={`h-12 rounded flex flex-col items-center justify-center text-xs font-mono transition-all ${
                  count > 2 
                    ? 'bg-red-600 text-white font-bold shadow-red-900/50 shadow-md' 
                    : count > 0 
                    ? 'bg-amber-500 text-black font-semibold' 
                    : 'bg-slate-800 text-slate-500'
                }`}
                title={`${day} at ${hour}:00 - Activity Count: ${count}`}
              >
                <span className="opacity-75">{hour}h</span>
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}