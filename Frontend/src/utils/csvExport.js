// CSV Export Utility Functions

export const downloadCSV = (data, filename) => {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Create CSV header
  const csvHeaders = headers.map(header => `"${header.label}"`).join(',');
  
  // Create CSV rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      let value = row[header.key];
      
      // Handle different data types
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else {
        value = String(value);
      }
      
      // Escape quotes and wrap in quotes
      value = value.replace(/"/g, '""');
      return `"${value}"`;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

export const exportReceiptsToCSV = (receipts, filename = 'receipts-export.csv') => {
  const headers = [
    { key: 'receiptNo', label: 'Receipt No' },
    { key: 'date', label: 'Date' },
    { key: 'fromName', label: 'Customer Name' },
    { key: 'relationType', label: 'Relation Type' },
    { key: 'relationName', label: 'Relation Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'address', label: 'Address' },
    { key: 'siteName', label: 'Site Name' },
    { key: 'plotVillaNo', label: 'Plot Number' },
    { key: 'plotSize', label: 'Plot Size' },
    { key: 'basicRate', label: 'Basic Rate' },
    { key: 'amount', label: 'Amount' },
    { key: 'other', label: 'Other Charges' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'tokenExpiryDate', label: 'Token Expiry Date' },
    { key: 'referenceName', label: 'Reference Name' },
    { key: 'cashChecked', label: 'Cash Payment' },
    { key: 'chequeChecked', label: 'Cheque Payment' },
    { key: 'chequeNo', label: 'Cheque Number' },
    { key: 'rtgsChecked', label: 'RTGS/NEFT/UPI Payment' },
    { key: 'rtgsNeft', label: 'RTGS/NEFT/UPI Reference' },
    { key: 'status', label: 'Status' },
    { key: 'adminDiscount', label: 'Admin Discount' },
    { key: 'adminRemarks', label: 'Admin Remarks' },
    { key: 'associateRemarks', label: 'Associate Remarks' },
    { key: 'createdByName', label: 'Created By' },
    { key: 'createdAt', label: 'Created At' }
  ];

  // Format the data for CSV (using raw numeric values for amounts)
  const formattedData = receipts.map(receipt => ({
    ...receipt,
    date: receipt.date ? new Date(receipt.date).toLocaleDateString() : '',
    tokenExpiryDate: receipt.tokenExpiryDate ? new Date(receipt.tokenExpiryDate).toLocaleDateString() : '',
    createdAt: receipt.createdAt ? new Date(receipt.createdAt).toLocaleString() : '',
    referenceName: receipt.referenceName || '', // Explicitly handle reference name
    cashChecked: receipt.cashChecked ? 'Yes' : 'No',
    chequeChecked: receipt.chequeChecked ? 'Yes' : 'No',
    rtgsChecked: receipt.rtgsChecked ? 'Yes' : 'No',
    basicRate: receipt.basicRate || 0,
    amount: receipt.amount || 0,
    totalAmount: receipt.totalAmount || 0,
    adminDiscount: receipt.adminDiscount || 0
  }));

  const csvContent = convertToCSV(formattedData, headers);
  downloadCSV(csvContent, filename);
};

export const exportPlotsToCSV = (plots, filename = 'plots-export.csv') => {
  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'siteName', label: 'Site Name' },
    { key: 'plotNumber', label: 'Plot Number' },
    { key: 'plotSize', label: 'Plot Size' },
    { key: 'basicRate', label: 'Basic Rate' },
    { key: 'totalPrice', label: 'Total Plot Price' },
    { key: 'status', label: 'Status' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'referenceName', label: 'Reference Name' },
    { key: 'receivedAmount', label: 'Received Amount (Token)' },
    { key: 'totalPaid', label: 'Total Paid' },
    { key: 'remainingBalance', label: 'Remaining Balance' },
    { key: 'associateName', label: 'Associate Name' },
    { key: 'description', label: 'Description' },
    { key: 'createdAt', label: 'Created At' }
  ];

  // Format the data for CSV (using raw numeric values for amounts)
  const formattedData = plots.map(plot => ({
    ...plot,
    createdAt: plot.createdAt ? new Date(plot.createdAt).toLocaleString() : '',
    basicRate: plot.basicRate || 0,
    totalPrice: plot.totalPrice || 0,
    receivedAmount: plot.receivedAmount || 0,
    totalPaid: plot.totalPaid || 0,
    remainingBalance: plot.remainingBalance || 0,
    customerName: plot.customerName || '',
    referenceName: plot.referenceName || '',
    associateName: plot.associateName || ''
  }));

  const csvContent = convertToCSV(formattedData, headers);
  downloadCSV(csvContent, filename);
};