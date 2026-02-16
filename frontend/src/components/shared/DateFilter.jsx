import React from 'react';
import { format } from 'date-fns';

/**
 * DateFilter Component
 * Allows users to select a date for filtering dashboard data
 */
const DateFilter = React.memo(({ selectedDate, onDateChange }) => {
  const handleDateChange = (e) => {
    onDateChange(e.target.value);
  };

  const handleTodayClick = () => {
    onDateChange(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <label htmlFor="date-picker" className="text-gray-700 font-medium whitespace-nowrap">
          Filter by Date:
        </label>
        <div className="flex items-center gap-3 flex-1">
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleTodayClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
});

DateFilter.displayName = 'DateFilter';

export default DateFilter;
