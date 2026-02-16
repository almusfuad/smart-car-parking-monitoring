import React from 'react';

/**
 * ChartContainer Component
 * Provides consistent wrapper for all charts with loading and error states
 * 
 * @param {string} title - Chart title to display
 * @param {boolean} loading - Loading state
 * @param {string} error - Error message
 * @param {React.ReactNode} summary - Optional summary section to display above chart
 * @param {React.ReactNode} children - Chart content to render when loaded
 */
const ChartContainer = React.memo(({ title, loading, error, summary, children }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        {!loading && !error && summary}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && children}
    </div>
  );
});

ChartContainer.displayName = 'ChartContainer';

export default ChartContainer;
