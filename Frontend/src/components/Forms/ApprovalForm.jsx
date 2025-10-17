import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Check, X, Calculator } from 'lucide-react';
import { receiptsAPI } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { numberToWords } from '../../utils/numberToWords';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';

const ApprovalForm = ({ receipt, isOpen, onClose, onSuccess }) => {
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [amountInWords, setAmountInWords] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm();

  const watchedDiscount = watch('discount', 0);

  // Calculate values at component level to avoid duplicate declarations
  const plotSize = receipt ? parseFloat(receipt.plotSize?.replace(/[^\d.]/g, '') || '0') : 0;
  const originalBasicRate = receipt ? receipt.basicRate || 0 : 0;
  const discountPerSqFt = parseFloat(watchedDiscount) || 0;
  const discountedBasicRate = Math.max(0, originalBasicRate - discountPerSqFt);

  useEffect(() => {
    if (receipt) {
      const baseAmount = plotSize * discountedBasicRate;
      
      // Parse other charges
      let otherAmount = 0;
      if (receipt.other) {
        if (!isNaN(receipt.other)) {
          otherAmount = parseFloat(receipt.other);
        } else {
          const numbers = receipt.other.match(/\d+\.?\d*/);
          if (numbers) {
            otherAmount = parseFloat(numbers[0]);
          }
        }
      }
      
      const finalTotal = baseAmount + otherAmount;
      setCalculatedTotal(Math.max(0, finalTotal));
      
      // Update amount in words
      if (finalTotal > 0) {
        setAmountInWords(numberToWords(finalTotal));
      } else {
        setAmountInWords('');
      }
    }
  }, [receipt, watchedDiscount, plotSize, discountedBasicRate]);

  const onApprove = async (data) => {
    try {
      setLoading(true);
      await receiptsAPI.approveReceipt(receipt.id, {
        discount: parseFloat(data.discount) || 0,
        remarks: data.adminRemarks || '',
        extendedExpiryDate: data.extendedExpiryDate || null
      });
      
      toast.success('Receipt approved successfully');
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error approving receipt:', error);
      toast.error('Failed to approve receipt');
    } finally {
      setLoading(false);
    }
  };

  const onReject = async (data) => {
    try {
      setLoading(true);
      await receiptsAPI.rejectReceipt(receipt.id, {
        remarks: data.adminRemarks || 'Rejected by admin'
      });
      
      toast.success('Receipt rejected');
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error rejecting receipt:', error);
      toast.error('Failed to reject receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen || !receipt) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Receipt Approval</h3>
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-sm text-gray-500">Receipt No:</span>
                <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                  {receipt.receiptNo}
                </span>
                <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Pending Approval
                </span>
              </div>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form className="p-6 space-y-6">
            {/* Customer Information - Read Only */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Customer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={receipt.fromName}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={receipt.mobile}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={receipt.address}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relation Type</label>
                  <input
                    type="text"
                    value={receipt.relationType}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relation Name</label>
                  <input
                    type="text"
                    value={receipt.relationName || ''}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Plot Information - Read Only */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Plot Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                  <input
                    type="text"
                    value={receipt.siteName}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plot Number</label>
                  <input
                    type="text"
                    value={receipt.plotVillaNo}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plot Size</label>
                  <input
                    type="text"
                    value={receipt.plotSize}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Basic Rate</label>
                  <input
                    type="text"
                    value={`₹${originalBasicRate.toLocaleString()}`}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Payment Information - Read Only */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Payment Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Date</label>
                  <input
                    type="text"
                    value={formatDate(receipt.date)}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Token Expiry Date</label>
                  <input
                    type="text"
                    value={formatDate(receipt.tokenExpiryDate)}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token Amount</label>
                  <input
                    type="text"
                    value={`₹${receipt.amount.toLocaleString()}`}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Charges</label>
                  <input
                    type="text"
                    value={receipt.other || ''}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Name</label>
                  <input
                    type="text"
                    value={receipt.referenceName || ''}
                    className="input bg-gray-50 border-gray-300"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Payment Methods - Read Only */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Payment Methods</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <label className={`flex items-center p-2 bg-white rounded border ${receipt.cashChecked ? 'border-green-300 bg-green-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={receipt.cashChecked}
                      className="rounded border-gray-300 text-green-600"
                      disabled
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Cash</span>
                  </label>
                  <label className={`flex items-center p-2 bg-white rounded border ${receipt.chequeChecked ? 'border-blue-300 bg-blue-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={receipt.chequeChecked}
                      className="rounded border-gray-300 text-blue-600"
                      disabled
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Cheque</span>
                  </label>
                  <label className={`flex items-center p-2 bg-white rounded border ${receipt.rtgsChecked ? 'border-purple-300 bg-purple-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={receipt.rtgsChecked}
                      className="rounded border-gray-300 text-purple-600"
                      disabled
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">RTGS/NEFT/UPI</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cheque Number</label>
                    <input
                      type="text"
                      value={receipt.chequeNo || ''}
                      className="input text-sm bg-gray-50 border-gray-300"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">RTGS/NEFT/UPI Reference</label>
                    <input
                      type="text"
                      value={receipt.rtgsNeft || ''}
                      className="input text-sm bg-gray-50 border-gray-300"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Associate Remarks - Highlighted */}
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="block text-sm font-bold text-yellow-900 mb-2">Associate Remarks</label>
                <div className="bg-white p-3 rounded border border-yellow-300">
                  <p className="text-gray-900 text-sm">
                    {receipt.associateRemarks || 'No special remarks provided by associate'}
                  </p>
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  Created by: {receipt.createdByName} on {formatDate(receipt.createdAt)}
                </p>
              </div>
            </div>

            {/* Admin Controls - Editable */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-md font-bold text-blue-900 mb-4">Admin Controls</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Discount Field */}
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">
                    Discount per sq ft (₹)
                  </label>
                  <input
                    {...register('discount', {
                      min: { value: 0, message: 'Discount cannot be negative' },
                      max: { value: originalBasicRate, message: 'Discount cannot exceed basic rate' }
                    })}
                    type="number"
                    step="0.01"
                    className="input border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter discount per sq ft"
                  />
                  {errors.discount && (
                    <p className="mt-1 text-sm text-red-600">{errors.discount.message}</p>
                  )}
                </div>

                {/* Extended Expiry Date */}
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">
                    Extend Expiry Date (Optional)
                  </label>
                  <input
                    {...register('extendedExpiryDate')}
                    type="date"
                    className="input border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Admin Remarks */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-blue-900 mb-1">Admin Remarks</label>
                <textarea
                  {...register('adminRemarks')}
                  rows={3}
                  className="input border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter admin remarks (optional)"
                />
              </div>

              {/* Calculation Display */}
              <div className="bg-white p-4 rounded-lg border border-blue-300">
                <h5 className="font-bold text-blue-900 mb-3 flex items-center">
                  <Calculator className="h-4 w-4 mr-2" />
                  Final Calculation
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Plot Size:</span>
                    <span>{plotSize} sq ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Original Basic Rate:</span>
                    <span>₹{originalBasicRate.toLocaleString()}/sq ft</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Discount per sq ft:</span>
                    <span>- ₹{discountPerSqFt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    <span>New Basic Rate:</span>
                    <span>₹{discountedBasicRate.toLocaleString()}/sq ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span>₹{(plotSize * discountedBasicRate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Charges:</span>
                    <span>₹{(receipt.other && !isNaN(receipt.other) ? parseFloat(receipt.other) : 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 text-green-700">
                    <span>Final Total:</span>
                    <span>₹{calculatedTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount in Words</label>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 font-medium text-sm">
                    {amountInWords || 'Amount in words will appear here'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
                disabled={isSubmitting || loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit(onReject)}
                className="btn-danger flex items-center"
                disabled={isSubmitting || loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Reject
              </button>
              <button
                type="button"
                onClick={handleSubmit(onApprove)}
                className="btn-success flex items-center"
                disabled={isSubmitting || loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApprovalForm;