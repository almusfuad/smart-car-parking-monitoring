import React from 'react';
import { formatDistanceToNow } from 'date-fns';

/**
 * AlertRow Component
 * Displays individual alert information in a table row
 * @param {Object} alert - Alert data
 * @param {boolean} isSelected - Whether alert is selected
 * @param {Function} onSelect - Callback when alert is selected/deselected
 * @param {Function} onAcknowledge - Callback when alert is acknowledged
 */
const AlertRow = React.memo(({ alert, isSelected, onSelect, onAcknowledge }) => {
  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '🔴';
      case 'WARNING':
        return '⚠️';
      case 'INFO':
        return 'ℹ️';
      default:
        return '📋';
    }
  };

  return (
    <tr className={alert.acknowledged ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}>
      {/* Checkbox */}
      <td className="px-4 py-4">
        {!alert.acknowledged && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(alert.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        )}
      </td>
      
      {/* Severity Badge */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSeverityStyles(alert.severity)}`}>
          <span className="mr-1">{getSeverityIcon(alert.severity)}</span>
          {alert.severity}
        </span>
      </td>
      
      {/* Device Code */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{alert.device_code}</div>
      </td>
      
      {/* Location (Facility/Zone) */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{alert.facility_name}</div>
        <div className="text-xs text-gray-500">{alert.zone_name}</div>
      </td>
      
      {/* Message */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 max-w-md">{alert.message}</div>
      </td>
      
      {/* Timestamp */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
        </div>
        <div className="text-xs text-gray-400">
          {new Date(alert.created_at).toLocaleString()}
        </div>
      </td>
      
      {/* Status Badge */}
      <td className="px-6 py-4 whitespace-nowrap">
        {alert.acknowledged ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Acknowledged
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Pending
          </span>
        )}
      </td>
      
      {/* Action Button */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {!alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="text-blue-600 hover:text-blue-900 transition-colors"
          >
            Acknowledge
          </button>
        )}
      </td>
    </tr>
  );
});

AlertRow.displayName = 'AlertRow';

export default AlertRow;
