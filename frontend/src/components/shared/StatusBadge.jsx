import React from 'react';

/**
 * StatusBadge Component
 * Displays status indicators with color coding
 * Supports: OK (green), WARNING (yellow), CRITICAL (red)
 */
const StatusBadge = React.memo(({ status, size = 'md' }) => {
  const getStatusClasses = () => {
    const baseClasses = 'inline-flex items-center gap-1 font-medium rounded-full';
    
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-2 text-base',
    };

    const statusClasses = {
      OK: 'bg-green-100 text-green-800 border border-green-300',
      WARNING: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      CRITICAL: 'bg-red-100 text-red-800 border border-red-300',
    };

    return `${baseClasses} ${sizeClasses[size]} ${statusClasses[status] || 'bg-gray-100 text-gray-800 border border-gray-300'}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'OK':
        return '✓';
      case 'WARNING':
        return '⚠';
      case 'CRITICAL':
        return '✕';
      default:
        return '●';
    }
  };

  return (
    <span className={getStatusClasses()}>
      <span className="font-bold">{getStatusIcon()}</span>
      <span>{status}</span>
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
