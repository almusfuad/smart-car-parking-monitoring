import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing filter state with automatic reset capabilities
 * Provides a flexible filter management system with reset and change tracking
 * 
 * @param {Object} initialFilters - Initial filter values
 * @param {Function} onFilterChange - Optional callback when filters change
 * @returns {Object} { filters, updateFilter, resetFilters, setFilters, activeCount }
 * 
 * @example
 * const { filters, updateFilter, resetFilters, activeCount } = useFilters({
 *   facility: '',
 *   zone: '',
 *   status: '',
 *   search: ''
 * });
 */
const useFilters = (initialFilters = {}, onFilterChange = null) => {
  const [filters, setFilters] = useState(initialFilters);

  // Update a single filter value
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Auto-reset dependent filters
      // If facility changes, reset zone
      if (key === 'facility') {
        newFilters.zone = '';
      }
      
      return newFilters;
    });
  }, []);

  // Reset all filters to initial values
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Count active filters (non-empty values)
  const activeCount = Object.values(filters).filter(value => {
    if (typeof value === 'string') return value !== '';
    if (typeof value === 'number') return value !== 0;
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  }).length;

  // Notify parent component when filters change
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  return {
    filters,
    updateFilter,
    resetFilters,
    setFilters,
    activeCount,
  };
};

export default useFilters;
