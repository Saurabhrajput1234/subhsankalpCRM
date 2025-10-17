import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { receiptsAPI, plotsAPI } from '../../utils/api';

import { numberToWords } from '../../utils/numberToWords';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateReceiptForm = ({ isOpen, onClose, onSuccess }) => {
  const [availablePlots, setAvailablePlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amountInWords, setAmountInWords] = useState('');
  const [plotSearch, setPlotSearch] = useState('');
  const [showPlotDropdown, setShowPlotDropdown] = useState(false);
  const [nextReceiptNo, setNextReceiptNo] = useState('0001');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0], // Today's date
      tokenExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +7 days from today
    }
  });

  const watchedSiteName = watch('siteName');
  const watchedPlotVillaNo = watch('plotVillaNo');
  const watchedAmount = watch('amount');
  const watchedDate = watch('date');

  useEffect(() => {
    if (isOpen) {
      fetchAvailablePlots();
      fetchNextReceiptNumber();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.plot-search-container')) {
        setShowPlotDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (watchedSiteName && watchedPlotVillaNo) {
      const plot = availablePlots.find(p => 
        p.siteName === watchedSiteName && p.plotNumber === watchedPlotVillaNo
      );
      setSelectedPlot(plot);
      if (plot) {
        setPlotSearch(plot.plotNumber);
      }
    }
  }, [watchedSiteName, watchedPlotVillaNo, availablePlots]);

  // Auto-calculate amount in words
  useEffect(() => {
    if (watchedAmount && !isNaN(watchedAmount) && watchedAmount > 0) {
      const words = numberToWords(parseFloat(watchedAmount));
      setAmountInWords(words);
    } else {
      setAmountInWords('');
    }
  }, [watchedAmount]);

  // Auto-update expiry date when date changes
  useEffect(() => {
    if (watchedDate) {
      const selectedDate = new Date(watchedDate);
      const expiryDate = new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      setValue('tokenExpiryDate', expiryDate.toISOString().split('T')[0]);
    }
  }, [watchedDate, setValue]);

  const fetchAvailablePlots = async () => {
    try {
      const response = await plotsAPI.getAvailablePlots();
      setAvailablePlots(response.data);
      console.log('Available plots fetched:', response.data);
      console.log('Unique sites found:', [...new Set(response.data.map(p => p.siteName))]);
    } catch (error) {
      console.error('Error fetching plots:', error);
      toast.error('Failed to fetch available plots');
    }
  };

  const fetchNextReceiptNumber = async () => {
    try {
      // Get the latest receipt to determine next number
      const response = await receiptsAPI.getReceipts({ pageSize: 1, sortBy: 'createdAt', sortOrder: 'desc' });
      const receipts = response.data.data || [];
      
      if (receipts.length > 0) {
        const lastReceiptNo = receipts[0].receiptNo;
        
        // All receipts now use 4-digit format after migration
        const lastNumber = parseInt(lastReceiptNo) || 0;
        const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
        setNextReceiptNo(nextNumber);
      } else {
        setNextReceiptNo('0001');
      }
    } catch (error) {
      console.error('Error fetching next receipt number:', error);
      setNextReceiptNo('0001'); // Default to 0001 if error
    }
  };

  const handlePlotSearch = (searchValue) => {
    setPlotSearch(searchValue);
    setShowPlotDropdown(true);
    
    // Only search within the selected site
    if (searchValue.length >= 2 && watchedSiteName) {
      const matchingPlot = availablePlotsForSite.find(p => 
        p.plotNumber.toLowerCase().includes(searchValue.toLowerCase())
      );
      
      if (matchingPlot) {
        setSelectedPlot(matchingPlot);
        setValue('plotVillaNo', matchingPlot.plotNumber);
      }
    }
  };

  const selectPlot = (plot) => {
    setSelectedPlot(plot);
    setPlotSearch(plot.plotNumber);
    setValue('plotVillaNo', plot.plotNumber);
    setShowPlotDropdown(false);
  };

  const handleSiteChange = (siteName) => {
    // Reset plot selection when site changes
    setSelectedPlot(null);
    setPlotSearch('');
    setValue('plotVillaNo', '');
    setValue('siteName', siteName);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      console.log('Creating receipt with data:', data);
      
      const response = await receiptsAPI.createReceipt(data);
      console.log('Receipt created successfully:', response.data);
      
      toast.success('Receipt created successfully');
      reset();
      fetchNextReceiptNumber(); // Refresh receipt number for next receipt
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating receipt:', error);
      
      let errorMessage = 'Failed to create receipt';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset({
      date: new Date().toISOString().split('T')[0],
      tokenExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setSelectedPlot(null);
    setAmountInWords('');
    setPlotSearch('');
    setShowPlotDropdown(false);
    setNextReceiptNo('0001');
    onClose();
  };

  if (!isOpen) return null;

  const uniqueSites = [...new Set(availablePlots.map(p => p.siteName))];
  const availablePlotsForSite = availablePlots.filter(p => p.siteName === watchedSiteName);
  
  // Add fallback sites if no plots loaded yet
  const allSites = uniqueSites.length > 0 ? uniqueSites : ['Hare Krishna Township Phase 2'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Create Token Receipt</h3>
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-sm text-gray-500">Receipt No:</span>
                <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                  {nextReceiptNo}
                </span>
              </div>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Customer Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Customer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    {...register('fromName', { required: 'Customer name is required' })}
                    type="text"
                    className="input"
                    placeholder="Enter customer name"
                  />
                  {errors.fromName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fromName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    {...register('mobile', { 
                      required: 'Mobile number is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Enter a valid 10-digit mobile number'
                      }
                    })}
                    type="tel"
                    className="input"
                    placeholder="Enter mobile number"
                  />
                  {errors.mobile && (
                    <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    {...register('address', { required: 'Address is required' })}
                    rows={3}
                    className="input"
                    placeholder="Enter complete address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relation Type
                  </label>
                  <select {...register('relationType')} className="input">
                    <option value="S/O">S/O (Son of)</option>
                    <option value="D/O">D/O (Daughter of)</option>
                    <option value="W/O">W/O (Wife of)</option>
                    <option value="H/O">H/O (Husband of)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relation Name
                  </label>
                  <input
                    {...register('relationName')}
                    type="text"
                    className="input"
                    placeholder="Enter relation name"
                  />
                </div>
              </div>
            </div>

            {/* Plot Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Plot Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Site Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Name *
                  </label>
                  <select
                    {...register('siteName', { required: 'Site name is required' })}
                    onChange={(e) => handleSiteChange(e.target.value)}
                    className="input"
                  >
                    <option value="">Select Site</option>
                    {allSites.map(site => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                  {errors.siteName && (
                    <p className="mt-1 text-sm text-red-600">{errors.siteName.message}</p>
                  )}
                </div>

                {/* Plot Number with Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plot Number *
                  </label>
                  <div className="relative plot-search-container">
                    <input
                      type="text"
                      {...register('plotVillaNo', { required: 'Plot number is required' })}
                      value={plotSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPlotSearch(value);
                        setValue('plotVillaNo', value);
                        handlePlotSearch(value);
                      }}
                      onFocus={() => setShowPlotDropdown(true)}
                      className="input"
                      placeholder={watchedSiteName ? `Search in ${watchedSiteName} (e.g., A-001)` : "Select site first"}
                      disabled={!watchedSiteName}
                    />
                    
                    {/* Search Results Dropdown */}
                    {showPlotDropdown && watchedSiteName && (plotSearch.length >= 1 || plotSearch === '') && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {availablePlotsForSite
                          .filter(plot => {
                            if (plotSearch === '') return true;
                            return plot.plotNumber.toLowerCase().includes(plotSearch.toLowerCase());
                          })
                          .slice(0, 15)
                          .map(plot => (
                            <div
                              key={plot.id}
                              onClick={() => {
                                setSelectedPlot(plot);
                                setPlotSearch(plot.plotNumber);
                                setValue('plotVillaNo', plot.plotNumber);
                                setShowPlotDropdown(false);
                              }}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                            >
                              <div className="font-medium text-gray-900">{plot.plotNumber}</div>
                              <div className="text-sm text-gray-600">
                                {plot.plotSize} • ₹{plot.basicRate.toLocaleString()}/sq ft
                              </div>
                            </div>
                          ))
                        }
                        {availablePlotsForSite.filter(plot => {
                          if (plotSearch === '') return true;
                          return plot.plotNumber.toLowerCase().includes(plotSearch.toLowerCase());
                        }).length === 0 && plotSearch !== '' && (
                          <div className="px-4 py-2 text-gray-500 text-sm">
                            No plots found matching "{plotSearch}"
                          </div>
                        )}
                        {plotSearch === '' && availablePlotsForSite.length > 0 && (
                          <div className="px-4 py-2 text-blue-600 text-sm border-b border-gray-100 font-medium">
                            {availablePlotsForSite.length} available plots - click to select
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.plotVillaNo && (
                    <p className="mt-1 text-sm text-red-600">{errors.plotVillaNo.message}</p>
                  )}
                </div>

                {/* Plot Size - Auto-filled */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plot Size
                  </label>
                  <input
                    type="text"
                    value={selectedPlot?.plotSize || ''}
                    className={`input ${selectedPlot ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}
                    readOnly
                    placeholder="Auto-filled"
                  />
                </div>

                {/* Basic Rate - Auto-filled */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Basic Rate (per sq ft/yd)
                  </label>
                  <input
                    type="text"
                    value={selectedPlot ? `₹${selectedPlot.basicRate.toLocaleString()}` : ''}
                    className={`input ${selectedPlot ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}
                    readOnly
                    placeholder="Auto-filled"
                  />
                </div>

                {/* Plot Value Calculation */}
                {selectedPlot && (
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <h6 className="font-medium text-blue-900 mb-2">Plot Value</h6>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>{selectedPlot.plotSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate:</span>
                          <span>₹{selectedPlot.basicRate.toLocaleString()}/sq ft</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t border-blue-300 pt-1">
                          <span>Total Value:</span>
                          <span>₹{(parseFloat(selectedPlot.plotSize?.replace(/[^\d.]/g, '') || '0') * selectedPlot.basicRate).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Payment Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Receipt Date *
                  </label>
                  <input
                    {...register('date', { required: 'Date is required' })}
                    type="date"
                    className="input"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>

                {/* Token Expiry Date - Auto calculated but editable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token Expiry Date *
                  </label>
                  <input
                    {...register('tokenExpiryDate', { required: 'Expiry date is required' })}
                    type="date"
                    className="input bg-blue-50 border-blue-300"
                  />
                  {errors.tokenExpiryDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.tokenExpiryDate.message}</p>
                  )}
                </div>

                {/* Amount Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    {...register('amount', { 
                      required: 'Amount is required',
                      min: { value: 1, message: 'Amount must be greater than 0' }
                    })}
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="Enter amount"
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Charges
                  </label>
                  <input
                    {...register('other')}
                    type="text"
                    className="input"
                    placeholder="Enter other charges"
                  />
                </div>

                {/* Amount in Words - Auto calculated */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Received Sum of Rupees (In Words)
                  </label>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 font-medium text-sm">
                      {amountInWords || 'Amount in words will appear here'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Name
                  </label>
                  <input
                    {...register('referenceName')}
                    type="text"
                    className="input"
                    placeholder="Enter reference name"
                  />
                </div>

                {/* Payment Method Section */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method *
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    {/* Payment Method Checkboxes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="flex items-center p-2 bg-white rounded border hover:bg-gray-50">
                        <input
                          {...register('cashChecked')}
                          type="checkbox"
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Cash</span>
                      </label>
                      <label className="flex items-center p-2 bg-white rounded border hover:bg-gray-50">
                        <input
                          {...register('chequeChecked')}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Cheque</span>
                      </label>
                      <label className="flex items-center p-2 bg-white rounded border hover:bg-gray-50">
                        <input
                          {...register('rtgsChecked')}
                          type="checkbox"
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">RTGS/NEFT/UPI</span>
                      </label>
                    </div>

                    {/* Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Cheque Number (if applicable)
                        </label>
                        <input
                          {...register('chequeNo')}
                          type="text"
                          className="input text-sm"
                          placeholder="Enter cheque number"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          RTGS/NEFT/UPI Reference (if applicable)
                        </label>
                        <input
                          {...register('rtgsNeft')}
                          type="text"
                          className="input text-sm"
                          placeholder="Enter transaction reference"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Associate Remarks */}
                <div className="md:col-span-2">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <label className="block text-sm font-bold text-yellow-900 mb-2">
                      Associate Remarks
                    </label>
                    <textarea
                      {...register('associateRemarks')}
                      rows={3}
                      className="input border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                      placeholder="Add any special notes for admin review..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || loading}
              >
                {isSubmitting || loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Receipt'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateReceiptForm;