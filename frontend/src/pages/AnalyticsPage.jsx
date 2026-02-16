import React, { useState } from 'react';
import HourlyUsageChart from '../components/analytics/charts/HourlyUsageChart';
import OccupancyTrendChart from '../components/analytics/charts/OccupancyTrendChart';
import DeviceHealthChart from '../components/analytics/charts/DeviceHealthChart';
import useFacilitiesAndZones from '../hooks/useFacilitiesAndZones';
import useFilters from '../hooks/useFilters';

const AnalyticsPage = () => {
  const [days, setDays] = useState(7);

  // Use shared hooks for filter management
  const { filters, updateFilter, resetFilters: resetFilterState } = useFilters({
    facility: '',
    zone: '',
  });

  // Fetch facilities and zones using shared hook
  const { facilities, zones } = useFacilitiesAndZones(filters.facility);

  const handleDaysChange = (newDays) => {
    setDays(Number(newDays));
  };

  const handleResetFilters = () => {
    resetFilterState();
    setDays(7);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">
            Performance metrics and data visualization
          </p>
        </div>
      </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Facility Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facility
              </label>
              <select
                value={filters.facility}
                onChange={(e) => updateFilter('facility', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Facilities</option>
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone
              </label>
              <select
                value={filters.zone}
                onChange={(e) => updateFilter('zone', e.target.value)}
                disabled={!filters.facility}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Zones</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Days Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trend Period
              </label>
              <select
                value={days}
                onChange={(e) => handleDaysChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Last 7 Days</option>
                <option value="14">Last 14 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="60">Last 60 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="space-y-6">
          {/* Hourly Usage Chart */}
          <HourlyUsageChart filters={filters} />

          {/* Occupancy Trend Chart */}
          <OccupancyTrendChart filters={filters} days={days} />

          {/* Device Health Chart */}
          <DeviceHealthChart filters={filters} />
        </div>
    </div>
  );
};

export default AnalyticsPage;
