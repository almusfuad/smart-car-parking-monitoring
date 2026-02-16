import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import SearchBar from '../shared/SearchBar';

/**
 * FilterPanel Component
 * Provides filtering controls for facilities, zones, status, and search
 * @param {Function} onFilterChange - Callback when filters change
 * @param {boolean} showStatusFilter - Whether to show status filter (for devices)
 */
const FilterPanel = ({ onFilterChange, showStatusFilter = false }) => {
  const [facilities, setFacilities] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch facilities on mount
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const data = await api.getFacilities();
        setFacilities(data);
      } catch (error) {
        console.error('Error loading facilities:', error);
      }
    };
    fetchFacilities();
  }, []);

  // Update zones when facility changes
  useEffect(() => {
    if (selectedFacility) {
      const facility = facilities.find(f => f.id === parseInt(selectedFacility));
      setZones(facility ? facility.zones : []);
      setSelectedZone(''); // Reset zone when facility changes
    } else {
      setZones([]);
      setSelectedZone('');
    }
  }, [selectedFacility, facilities]);

  // Notify parent of filter changes
  useEffect(() => {
    const filters = {
      ...(selectedFacility && { facility: selectedFacility }),
      ...(selectedZone && { zone: selectedZone }),
      ...(selectedStatus && { status: selectedStatus }),
      ...(searchQuery && { search: searchQuery }),
      sort_by: sortBy,
      order: sortOrder,
    };
    onFilterChange(filters);
  }, [selectedFacility, selectedZone, selectedStatus, searchQuery, sortBy, sortOrder, onFilterChange]);

  const handleReset = () => {
    setSelectedFacility('');
    setSelectedZone('');
    setSelectedStatus('');
    setSearchQuery('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const activeFiltersCount = [
    selectedFacility,
    selectedZone,
    selectedStatus,
    searchQuery,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {activeFiltersCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={handleReset}
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
              onSearch={setSearchQuery}
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
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
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
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                disabled={!selectedFacility}
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
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
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
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="utilization">Utilization</option>
                  <option value="alerts">Alerts</option>
                  <option value="health">Health</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <svg
                    className={`w-5 h-5 transform transition-transform ${
                      sortOrder === 'desc' ? 'rotate-180' : ''
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
