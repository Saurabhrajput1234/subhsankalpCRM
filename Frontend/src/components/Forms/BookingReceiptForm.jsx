import React, { useState, useEffect } from 'react';
import { X, Calculator, Receipt } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { receiptsAPI, plotsAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import Modal from '../UI/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';
import PrintReceipt from '../Receipt/PrintReceipt';
import toast from 'react-hot-toast';

const BookingReceiptForm = ({ isOpen, onClose, plot, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState(null);
  const [tokenReceipt, setTokenReceipt] = useState(null);
  const [allReceipts, setAllReceipts] = useState([]);
  const [formData, setFormData] = useState({
    fromName: '',
    relationName: '',
    address: '',
    mobile: '',
    referenceName: '',
    amount: '',
    other: '',
    cashChecked: false,
    chequeChecked: false,
    rtgsChecked: false,
    chequeNo: '',
    rtgsNeft: '',
    adminRemarks: ''
  });

  // Fetch token receipt data when plot is selected
  useEffect(() => {
    if (plot && isOpen) {
      fetchTokenReceipt();
    }
  }, [plot, isOpen]);

  const fetchTokenReceipt = async () => {
    try {
      setLoading(true);
      // Get ALL receipts for this plot
      const response = await receiptsAPI.getReceiptsByPlot(plot.id);
      const receipts = response.data || [];
      setAllReceipts(receipts);
      
      // Get the latest token receipt for pre-filling form
      const tokenReceipts = receipts.filter(r => r.receiptType === 'token');
      
      if (tokenReceipts.length > 0) {
        const latestToken = tokenReceipts[0]; // Assuming sorted by date desc
        setTokenReceipt(latestToken);
        
        // Pre-fill form with token receipt data
        setFormData(prev => ({
          ...prev,
          fromName: latestToken.fromName || '',
          relationName: latestToken.relationName || '',
          address: latestToken.address || '',
          mobile: latestToken.mobile || '',
          referenceName: latestToken.referenceName || '',
          // Don't pre-fill amount - admin will enter new payment amount
        }));
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('Failed to load customer information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateTotalReceived = () => {
    const currentAmount = parseFloat(formData.amount) || 0;
    
    // Calculate total from ALL existing receipts (approved + pending token receipts)
    const existingTotal = allReceipts.reduce((total, receipt) => {
      // Include approved receipts (both token and booking)
      if (receipt.status === 'Approved') {
        return total + (receipt.totalAmount > 0 ? receipt.totalAmount : receipt.amount);
      }
      // Include pending token receipts
      if (receipt.status === 'Pending' && receipt.receiptType === 'token') {
        return total + receipt.amount;
      }
      return total;
    }, 0);
    
    return currentAmount + existingTotal;
  };

  const calculatePercentage = () => {
    const totalReceived = calculateTotalReceived();
    const totalPrice = plot?.totalPrice || 0;
    return totalPrice > 0 ? ((totalReceived / totalPrice) * 100).toFixed(1) : 0;
  };

  const canMarkAsSold = () => {
    return parseFloat(calculatePercentage()) >= 60;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (!formData.cashChecked && !formData.chequeChecked && !formData.rtgsChecked) {
      toast.error('Please select at least one payment method');
      return;
    }

    if (formData.chequeChecked && !formData.chequeNo.trim()) {
      toast.error('Please enter cheque number');
      return;
    }

    if (formData.rtgsChecked && !formData.rtgsNeft.trim()) {
      toast.error('Please enter RTGS/NEFT/UPI details');
      return;
    }

    try {
      setLoading(true);

      const receiptData = {
        receiptType: 'booking',
        fromName: formData.fromName,
        relationName: formData.relationName,
        address: formData.address,
        mobile: formData.mobile,
        referenceName: formData.referenceName,
        siteName: plot.siteName,
        plotVillaNo: plot.plotNumber,
        plotSize: plot.plotSize,
        basicRate: plot.basicRate,
        amount: parseFloat(formData.amount),
        other: formData.other,
        cashChecked: formData.cashChecked,
        chequeChecked: formData.chequeChecked,
        rtgsChecked: formData.rtgsChecked,
        chequeNo: formData.chequeNo,
        rtgsNeft: formData.rtgsNeft,
        adminRemarks: formData.adminRemarks,
        plotId: plot.id,
        status: 'Approved' // Admin creates approved receipts
      };

      const response = await receiptsAPI.createReceipt(receiptData);
      const newReceipt = response.data;

      // Update plot status if 60% reached
      if (canMarkAsSold()) {
        await plotsAPI.updatePlotStatus(plot.id, 'Sold');
        toast.success('Plot marked as SOLD (60% payment received)');
      }

      setCreatedReceipt(newReceipt);
      setShowPreview(true);
      
      toast.success('Booking receipt created successfully!');
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error creating booking receipt:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setCreatedReceipt(null);
    onClose();
  };

  if (!plot) return null;

  return (
    <>
      <Modal isOpen={isOpen && !showPreview} onClose={onClose} title="Create Booking Receipt" size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {loading && <LoadingSpinner />}
          
          {/* Plot Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Plot Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Site:</span>
                <span className="ml-2 text-blue-900">{plot.siteName}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Plot No:</span>
                <span className="ml-2 text-blue-900">{plot.plotNumber}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Size:</span>
                <span className="ml-2 text-blue-900">{plot.plotSize}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Total Price:</span>
                <span className="ml-2 text-blue-900 font-medium">{formatCurrency(plot.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-medium text-green-900 mb-3 flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Payment Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-700">Previous Payments:</span>
                <span className="ml-2 text-green-900">
                  {formatCurrency(calculateTotalReceived() - (parseFloat(formData.amount) || 0))}
                </span>
                <div className="text-xs text-green-600 ml-2">
                  ({allReceipts.length} receipt{allReceipts.length !== 1 ? 's' : ''})
                </div>
              </div>
              <div>
                <span className="font-medium text-green-700">Current Payment:</span>
                <span className="ml-2 text-green-900 font-medium">
                  {formData.amount ? formatCurrency(parseFloat(formData.amount)) : '₹0'}
                </span>
              </div>
              <div>
                <span className="font-medium text-green-700">Total Received:</span>
                <span className="ml-2 text-green-900 font-bold">
                  {formatCurrency(calculateTotalReceived())}
                </span>
              </div>
              <div>
                <span className="font-medium text-green-700">Percentage:</span>
                <span className={`ml-2 font-bold ${canMarkAsSold() ? 'text-green-600' : 'text-orange-600'}`}>
                  {calculatePercentage()}%
                  {canMarkAsSold() && <span className="ml-1 text-xs">(✓ Can mark as SOLD)</span>}
                </span>
              </div>
            </div>
            
            {/* Receipt Breakdown */}
            {allReceipts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="text-xs text-green-700 font-medium mb-2">Payment History:</div>
                <div className="space-y-1">
                  {allReceipts.map((receipt, index) => (
                    <div key={receipt.id} className="flex justify-between text-xs">
                      <span className="text-green-600">
                        {receipt.receiptType === 'token' ? '🎫' : '📄'} {receipt.receiptNo} 
                        <span className="ml-1 text-green-500">({receipt.status})</span>
                      </span>
                      <span className="text-green-700 font-medium">
                        {formatCurrency(receipt.totalAmount > 0 ? receipt.totalAmount : receipt.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                name="fromName"
                value={formData.fromName}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relation Name (S/O, D/O, W/O)
              </label>
              <input
                type="text"
                name="relationName"
                value={formData.relationName}
                onChange={handleInputChange}
                className="input"
                placeholder="Father's/Husband's name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Name
              </label>
              <input
                type="text"
                name="referenceName"
                value={formData.referenceName}
                onChange={handleInputChange}
                className="input"
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="input"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Details
                </label>
                <input
                  type="text"
                  name="other"
                  value={formData.other}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Additional details"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Methods *
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="cashChecked"
                    checked={formData.cashChecked}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Cash</label>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="chequeChecked"
                      checked={formData.chequeChecked}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Cheque</label>
                  </div>
                  {formData.chequeChecked && (
                    <input
                      type="text"
                      name="chequeNo"
                      value={formData.chequeNo}
                      onChange={handleInputChange}
                      className="input ml-6"
                      placeholder="Cheque Number"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="rtgsChecked"
                      checked={formData.rtgsChecked}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">RTGS/NEFT/UPI</label>
                  </div>
                  {formData.rtgsChecked && (
                    <input
                      type="text"
                      name="rtgsNeft"
                      value={formData.rtgsNeft}
                      onChange={handleInputChange}
                      className="input ml-6"
                      placeholder="Transaction ID / Reference Number"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Admin Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Remarks
              </label>
              <textarea
                name="adminRemarks"
                value={formData.adminRemarks}
                onChange={handleInputChange}
                rows={3}
                className="input"
                placeholder="Any additional remarks or notes"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={loading}
            >
              <Receipt className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Booking Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Preview */}
      {showPreview && createdReceipt && (
        <PrintReceipt
          receipt={createdReceipt}
          isOpen={showPreview}
          onClose={handleClosePreview}
          type="booking"
        />
      )}
    </>
  );
};

export default BookingReceiptForm;