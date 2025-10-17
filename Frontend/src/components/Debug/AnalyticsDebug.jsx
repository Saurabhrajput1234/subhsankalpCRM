import React, { useState, useEffect } from 'react';
import { receiptsAPI } from '../../utils/api';

const AnalyticsDebug = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await receiptsAPI.getReceipts({ pageSize: 10 });
      setReceipts(response.data.data || []);
      console.log('Debug - Raw receipts data:', response.data.data);
    } catch (error) {
      console.error('Debug - Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading debug data...</div>;

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Analytics Debug Information</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">Total Receipts: {receipts.length}</h4>
          <h4 className="font-semibold">Approved Receipts: {receipts.filter(r => r.status === 'Approved').length}</h4>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Sample Receipt Data:</h4>
          {receipts.slice(0, 2).map(receipt => (
            <div key={receipt.id} className="bg-white p-3 rounded border mb-2 text-xs">
              <div><strong>ID:</strong> {receipt.id}</div>
              <div><strong>Receipt No:</strong> {receipt.receiptNo}</div>
              <div><strong>Status:</strong> {receipt.status}</div>
              <div><strong>Amount:</strong> {receipt.amount}</div>
              <div><strong>Total Amount:</strong> {receipt.totalAmount}</div>
              <div><strong>Created At:</strong> {receipt.createdAt}</div>
              <div><strong>Date:</strong> {receipt.date}</div>
              <div><strong>Cash Checked:</strong> {String(receipt.cashChecked)}</div>
              <div><strong>Cheque Checked:</strong> {String(receipt.chequeChecked)}</div>
              <div><strong>RTGS Checked:</strong> {String(receipt.rtgsChecked)}</div>
              <div><strong>Created By:</strong> {receipt.createdByName}</div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="font-semibold mb-2">Payment Method Analysis:</h4>
          <div className="bg-white p-3 rounded border text-xs">
            {receipts.filter(r => r.status === 'Approved').map(receipt => (
              <div key={receipt.id} className="mb-1">
                <span className="font-medium">{receipt.receiptNo}:</span>
                <span className="ml-2">
                  Cash: {receipt.cashChecked ? '✓' : '✗'} | 
                  Cheque: {receipt.chequeChecked ? '✓' : '✗'} | 
                  RTGS: {receipt.rtgsChecked ? '✓' : '✗'} | 
                  Amount: ₹{receipt.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDebug;
"