import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import DashboardSummary from '../components/DashboardSummary';
import DateFilter from '../components/DateFilter';
import ZonePerformanceTable from '../components/ZonePerformanceTable';
import DeviceHeartbeat from '../components/DeviceHeartbeat';
import FilterPanel from '../components/FilterPanel';
import ExportButton from '../components/ExportButton';
import useDashboardData from '../hooks/useDashboardData';
import { exportZonesData, exportDevicesData, exportDashboardSummary } from '../utils/exportHelpers';

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filters, setFilters] = useState({});
  const { data, loading, error } = useDashboardData(selectedDate, filters);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleExportAll = (format) => {
    exportDashboardSummary(data.summary, data.zones, data.devices, format);
  };

  const handleExportZones = (format) => {
    if (data.zones) {
      exportZonesData(data.zones, format);
    }
  };

  const handleExportDevices = (format) => {
    if (data.devices) {
      exportDevicesData(data.devices, format);
    }
  };

  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Smart Parking Dashboard
          </h2>
          <p className="text-gray-600">
            Monitor parking zones, devices, and system performance in real-time
          </p>
        </div>
        <ExportButton 
          onExport={handleExportAll} 
          disabled={loading || !data.zones || !data.devices}
          label="Export All"
        />
      </div>

      {/* Date Filter */}
      <DateFilter selectedDate={selectedDate} onDateChange={handleDateChange} />

      {/* Filter Panel */}
      <FilterPanel onFilterChange={handleFilterChange} showStatusFilter={true} />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <div>
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <DashboardSummary data={data.summary} loading={loading} />

      {/* Zone Performance Table */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-semibold text-gray-800">Zone Performance</h3>
          <ExportButton 
            onExport={handleExportZones} 
            disabled={loading || !data.zones || data.zones.length === 0}
            label="Export Zones"
          />
        </div>
        <ZonePerformanceTable zones={data.zones} loading={loading} />
      </div>

      {/* Device Heartbeat Monitor */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-semibold text-gray-800">Device Status</h3>
          <ExportButton 
            onExport={handleExportDevices} 
            disabled={loading || !data.devices || data.devices.length === 0}
            label="Export Devices"
          />
        </div>
        <DeviceHeartbeat devices={data.devices} loading={loading} />
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <p className="mt-1">
          Showing data for {selectedDate}
          {filters.facility && ' • Filtered by facility'}
          {filters.zone && ' • Filtered by zone'}
          {filters.status && ` • Status: ${filters.status}`}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
