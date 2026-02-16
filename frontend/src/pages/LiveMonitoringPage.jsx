import React from 'react';
import LiveMonitoring from '../components/live-monitoring/LiveMonitoring';

/**
 * Live Monitoring Page
 * Real-time device status monitoring with auto-refresh
 */
const LiveMonitoringPage = () => {
  return (
    <div className="space-y-6">
      <LiveMonitoring />
    </div>
  );
};

export default LiveMonitoringPage;
