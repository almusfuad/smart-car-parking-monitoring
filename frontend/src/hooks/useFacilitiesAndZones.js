import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom hook for managing facilities and zones data
 * Automatically fetches facilities on mount and zones when facility changes
 * Handles the relationship between facilities and zones
 * 
 * @param {string|number} selectedFacility - Currently selected facility ID
 * @returns {Object} { facilities, zones, loading, error }
 * 
 * @example
 * const { facilities, zones, loading } = useFacilitiesAndZones(selectedFacility);
 */
const useFacilitiesAndZones = (selectedFacility = '') => {
  const [facilities, setFacilities] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch facilities on mount
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getFacilities();
        setFacilities(data);
      } catch (err) {
        console.error('[useFacilitiesAndZones] Error loading facilities:', err);
        setError(err.message || 'Failed to load facilities');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFacilities();
  }, []);

  // Update zones when facility changes
  useEffect(() => {
    if (selectedFacility) {
      // Try to find zones from the facilities data first (nested structure)
      const facility = facilities.find(f => f.id === parseInt(selectedFacility));
      
      if (facility && facility.zones) {
        // Zones are nested in facility object
        setZones(facility.zones);
      } else {
        // Fetch zones separately if not nested
        const fetchZones = async () => {
          try {
            const data = await api.getZonesByFacility(selectedFacility);
            setZones(data);
          } catch (err) {
            console.error('[useFacilitiesAndZones] Error loading zones:', err);
            setZones([]);
          }
        };
        fetchZones();
      }
    } else {
      // Clear zones when no facility is selected
      setZones([]);
    }
  }, [selectedFacility, facilities]);

  return {
    facilities,
    zones,
    loading,
    error,
  };
};

export default useFacilitiesAndZones;
