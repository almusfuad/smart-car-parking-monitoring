import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 */
export const exportToCSV = (data, filename = 'export') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Convert data to CSV string
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        let cell = row[header];
        // Handle null/undefined
        if (cell == null) cell = '';
        // Escape quotes and wrap in quotes if contains comma
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          cell = `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data to Excel format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {string} sheetName - Name of the worksheet
 */
export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(data[0]).map(key => {
    const maxLength = Math.max(
      key.length,
      ...data.map(row => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLength + 2, maxWidth) };
  });
  worksheet['!cols'] = colWidths;

  // Write to file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export data to PDF format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {string} title - Title for the PDF document
 */
export const exportToPDF = (data, filename = 'export', title = 'Report') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Add timestamp
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
  
  // Prepare table data
  const headers = Object.keys(data[0]).map(key => 
    key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  );
  const rows = data.map(row => Object.values(row).map(val => val ?? ''));
  
  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 35 },
  });
  
  // Save the PDF
  doc.save(`${filename}.pdf`);
};

/**
 * Export zones performance data
 * @param {Array} zones - Zones data array
 * @param {string} format - Export format ('csv', 'excel', 'pdf')
 * @param {string} filename - Custom filename (optional)
 */
export const exportZonesData = (zones, format = 'csv', filename = null) => {
  if (!zones || zones.length === 0) {
    alert('No zones data to export');
    return;
  }

  const exportData = zones.map(zone => ({
    'Zone': zone.name,
    'Facility': zone.facility,
    'Total Devices': zone.total_devices,
    'Occupied Slots': zone.occupied_slots,
    'Daily Capacity': zone.daily_capacity,
    'Utilization %': zone.utilization_percentage,
    'Active Alerts': zone.active_alerts,
  }));

  const defaultFilename = `zones-performance-${new Date().toISOString().split('T')[0]}`;
  const finalFilename = filename || defaultFilename;

  switch (format) {
    case 'csv':
      exportToCSV(exportData, finalFilename);
      break;
    case 'excel':
      exportToExcel(exportData, finalFilename, 'Zones Performance');
      break;
    case 'pdf':
      exportToPDF(exportData, finalFilename, 'Zones Performance Report');
      break;
    default:
      console.error('Unsupported export format:', format);
  }
};

/**
 * Export devices data
 * @param {Array} devices - Devices data array
 * @param {string} format - Export format ('csv', 'excel', 'pdf')
 * @param {string} filename - Custom filename (optional)
 */
export const exportDevicesData = (devices, format = 'csv', filename = null) => {
  if (!devices || devices.length === 0) {
    alert('No devices data to export');
    return;
  }

  const exportData = devices.map(device => ({
    'Device Code': device.code,
    'Zone': device.zone,
    'Facility': device.facility,
    'Status': device.status,
    'Health Score': device.health_score,
    'Active': device.is_active ? 'Yes' : 'No',
    'Last Seen': device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never',
    'Alerts Count': device.alerts_count,
  }));

  const defaultFilename = `devices-heartbeat-${new Date().toISOString().split('T')[0]}`;
  const finalFilename = filename || defaultFilename;

  switch (format) {
    case 'csv':
      exportToCSV(exportData, finalFilename);
      break;
    case 'excel':
      exportToExcel(exportData, finalFilename, 'Device Heartbeat');
      break;
    case 'pdf':
      exportToPDF(exportData, finalFilename, 'Device Heartbeat Report');
      break;
    default:
      console.error('Unsupported export format:', format);
  }
};

/**
 * Export live devices data
 * @param {Array} devices - Live devices data array
 * @param {string} format - Export format ('csv', 'excel', 'pdf')
 * @param {string} filename - Custom filename (optional)
 */
export const exportLiveDevicesData = (devices, format = 'csv', filename = null) => {
  if (!devices || devices.length === 0) {
    alert('No live devices data to export');
    return;
  }

  const exportData = devices.map(device => ({
    'Device Code': device.code,
    'Zone': device.zone.name,
    'Facility': device.facility.name,
    'Status': device.status,
    'Health Score': device.health_score,
    'Voltage (V)': device.telemetry?.voltage?.toFixed(2) || 'N/A',
    'Current (A)': device.telemetry?.current?.toFixed(2) || 'N/A',
    'Power (W)': device.telemetry?.power?.toFixed(2) || 'N/A',
    'Parking Status': device.parking?.is_occupied ? 'Occupied' : 'Available',
    'Last Seen': device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never',
    'Active Alerts': device.alerts_count,
  }));

  const defaultFilename = `live-monitoring-${new Date().toISOString().split('T')[0]}`;
  const finalFilename = filename || defaultFilename;

  switch (format) {
    case 'csv':
      exportToCSV(exportData, finalFilename);
      break;
    case 'excel':
      exportToExcel(exportData, finalFilename, 'Live Monitoring');
      break;
    case 'pdf':
      exportToPDF(exportData, finalFilename, 'Live Monitoring Report');
      break;
    default:
      console.error('Unsupported export format:', format);
  }
};

/**
 * Export dashboard summary data
 * @param {Object} summary - Summary data object
 * @param {Array} zones - Zones data array
 * @param {Array} devices - Devices data array
 * @param {string} format - Export format ('csv', 'excel', 'pdf')
 */
export const exportDashboardSummary = (summary, zones, devices, format = 'excel') => {
  if (!summary && !zones && !devices) {
    alert('No data to export');
    return;
  }

  const filename = `dashboard-report-${new Date().toISOString().split('T')[0]}`;

  if (format === 'excel') {
    // Create multi-sheet Excel workbook
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    if (summary) {
      const summaryData = [
        { Metric: 'Total Events', Value: summary.total_events },
        { Metric: 'Current Occupancy', Value: summary.current_occupancy },
        { Metric: 'Active Devices', Value: summary.active_devices },
        { Metric: 'Active Alerts', Value: summary.alerts_count },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Zones sheet
    if (zones && zones.length > 0) {
      const zonesData = zones.map(zone => ({
        'Zone': zone.name,
        'Facility': zone.facility,
        'Total Devices': zone.total_devices,
        'Occupied Slots': zone.occupied_slots,
        'Daily Capacity': zone.daily_capacity,
        'Utilization %': zone.utilization_percentage,
        'Active Alerts': zone.active_alerts,
      }));
      const zonesSheet = XLSX.utils.json_to_sheet(zonesData);
      XLSX.utils.book_append_sheet(workbook, zonesSheet, 'Zones');
    }

    // Devices sheet
    if (devices && devices.length > 0) {
      const devicesData = devices.map(device => ({
        'Device Code': device.code,
        'Zone': device.zone,
        'Facility': device.facility,
        'Status': device.status,
        'Health Score': device.health_score,
        'Active': device.is_active ? 'Yes' : 'No',
        'Alerts Count': device.alerts_count,
      }));
      const devicesSheet = XLSX.utils.json_to_sheet(devicesData);
      XLSX.utils.book_append_sheet(workbook, devicesSheet, 'Devices');
    }

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } else if (format === 'pdf') {
    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Dashboard Report', 14, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
    yPos += 15;

    // Summary section
    if (summary) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Summary', 14, yPos);
      yPos += 8;

      const summaryData = [
        ['Total Events', summary.total_events],
        ['Current Occupancy', summary.current_occupancy],
        ['Active Devices', summary.active_devices],
        ['Active Alerts', summary.alerts_count],
      ];

      autoTable(doc, {
        body: summaryData,
        startY: yPos,
        theme: 'plain',
        styles: { fontSize: 10 },
        margin: { left: 14 },
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }

    // Zones section
    if (zones && zones.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Zones Performance', 14, yPos);
      yPos += 8;

      const zonesHeaders = ['Zone', 'Facility', 'Devices', 'Utilization %', 'Alerts'];
      const zonesRows = zones.slice(0, 10).map(zone => [
        zone.name,
        zone.facility,
        zone.total_devices,
        zone.utilization_percentage,
        zone.active_alerts,
      ]);

      autoTable(doc, {
        head: [zonesHeaders],
        body: zonesRows,
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    doc.save(`${filename}.pdf`);
  }
};
