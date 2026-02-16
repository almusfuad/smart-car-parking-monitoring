import React, { useState, useEffect } from 'react';
import SearchBar from '../shared/SearchBar';
import useFacilitiesAndZones from '../../hooks/useFacilitiesAndZones';
import useFilters from '../../hooks/useFilters';

/**
 * FilterPanel Component
 * Provides filtering controls for facilities, zones, status, and search
 * @param {Function} onFilterChange - Callback when filters change
 * @param {boolean} showStatusFilter - Whether to show status filter (for devices)
 */
const FilterPanel = ({ onFilterChange, showStatusFilter = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize filters with useFilters hook
  const { filters, updateFilter, resetFilters, activeCount } = useFilters({
    facility: '',
    zone: '',
    status: '',
    search: '',
    sort_by: 'name',
    order: 'asc',
  });

  // Fetch facilities and zones using shared hook
  const { facilities, zones } = useFacilitiesAndZones(filters.facility);

  // Notify parent of filter changes
  useEffect(() => {
    const filterParams = {
      ...(filters.facility && { facility: filters.facility }),
      ...(filters.zone && { zone: filters.zone }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
      sort_by: filters.sort_by,
      order: filters.order,
    };
    onFilterChange(filterParams);
  }, [filters, onFilterChange]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {activeCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Reset All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <SearchBar
              onSearch={(value) => updateFilter('search', value)}
              placeholder="Search by name or code..."
            />
          </div>

          {/* Dropdowns Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Facility Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facility
              </label>
              <select
                value={filters.facility}
                onChange={(e) => updateFilter('facility', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone
              </label>
              <select
                value={filters.zone}
                onChange={(e) => updateFilter('zone', e.target.value)}
                disabled={!filters.facility}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Zones</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter (conditional) */}
            {showStatusFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="OK">OK</option>
                  <option value="WARNING">Warning</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            )}

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.sort_by}
                  onChange={(e) => updateFilter('sort_by', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="utilization">Utilization</option>
                  <option value="alerts">Alerts</option>
                  <option value="health">Health</option>
                </select>
                <button
                  onClick={() => updateFilter('order', filters.order === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title={filters.order === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <svg
                    className={`w-5 h-5 transform transition-transform ${
                      filters.order === 'desc' ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
