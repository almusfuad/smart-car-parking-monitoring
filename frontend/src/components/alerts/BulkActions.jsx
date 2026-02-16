import React from 'react';

/**
 * BulkActions Component
 * Displays bulk action controls for selected alerts
 * @param {number} selectedCount - Number of selected alerts
 * @param {Function} onBulkAcknowledge - Callback for bulk acknowledge action
 */
const BulkActions = React.memo(({ selectedCount, onBulkAcknowledge }) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
      <span className="text-blue-700 font-medium">
        {selectedCount} alert{selectedCount > 1 ? 's' : ''} selected
      </span>
      <button
        onClick={onBulkAcknowledge}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Acknowledge Selected
      </button>
    </div>
  );
});

BulkActions.displayName = 'BulkActions';

export default BulkActions;
