import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { plotsAPI } from '../../utils/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';

const CreatePlotForm = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      console.log('Creating plot with data:', data);
      
      // Transform form data to match DTO structure
      const plotData = {
        siteName: data.siteName,
        block: data.block || '',
        plotNumber: data.plotNumber,
        length: parseFloat(data.length) || 0,
        width: parseFloat(data.width) || 0,

        plotSize: data.plotSize || '',
        basicRate: parseFloat(data.basicRate),
        road: data.road || '',
        plcApplicable: data.plcApplicable || false,
        typeofPLC: data.typeofPLC || '',
        facing: data.facing || '',
        registeredCompany: data.registeredCompany || '',
        gataKhesraNo: data.gataKhesraNo || '',
        availablePlot: data.availablePlot !== false, // Default to true
        description: data.description || ''
      };
      
      const response = await plotsAPI.createPlot(plotData);
      console.log('Plot created successfully:', response.data);
      
      toast.success('Plot created successfully');
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating plot:', error);
      
      let errorMessage = 'Failed to create plot';
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
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Add New Plot</h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Site Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Name *
                  </label>
                  <input
                    {...register('siteName', { required: 'Site name is required' })}
                    type="text"
                    className="input"
                    placeholder="Enter site name"
                  />
                  {errors.siteName && (
                    <p className="mt-1 text-sm text-red-600">{errors.siteName.message}</p>
                  )}
                </div>

                {/* Block */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Block
                  </label>
                  <input
                    {...register('block')}
                    type="text"
                    className="input"
                    placeholder="Enter block (e.g., A, B, C)"
                  />
                </div>

                {/* Plot Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plot Number *
                  </label>
                  <input
                    {...register('plotNumber', { required: 'Plot number is required' })}
                    type="text"
                    className="input"
                    placeholder="Enter plot number"
                  />
                  {errors.plotNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.plotNumber.message}</p>
                  )}
                </div>

                {/* Registered Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registered Company
                  </label>
                  <input
                    {...register('registeredCompany')}
                    type="text"
                    className="input"
                    placeholder="Enter registered company name"
                  />
                </div>
              </div>
            </div>

            {/* Plot Dimensions */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Plot Dimensions</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Length (ft)
                  </label>
                  <input
                    {...register('length', { 
                      min: { value: 0, message: 'Length must be positive' }
                    })}
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="Enter length"
                  />
                  {errors.length && (
                    <p className="mt-1 text-sm text-red-600">{errors.length.message}</p>
                  )}
                </div>

                {/* Width */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (ft)
                  </label>
                  <input
                    {...register('width', { 
                      min: { value: 0, message: 'Width must be positive' }
                    })}
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="Enter width"
                  />
                  {errors.width && (
                    <p className="mt-1 text-sm text-red-600">{errors.width.message}</p>
                  )}
                </div>

                {/* Plot Size */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plot Size *
                  </label>
                  <input
                    {...register('plotSize', { required: 'Plot size is required' })}
                    type="text"
                    className="input"
                    placeholder="e.g., 1000 sq yard, 500 sq yd"
                  />
                  {errors.plotSize && (
                    <p className="mt-1 text-sm text-red-600">{errors.plotSize.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing & Location */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Pricing & Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Basic Rate (₹ per sq yard) *
                  </label>
                  <input
                    {...register('basicRate', { 
                      required: 'Basic rate is required',
                      min: { value: 1, message: 'Basic rate must be greater than 0' }
                    })}
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="Enter basic rate"
                  />
                  {errors.basicRate && (
                    <p className="mt-1 text-sm text-red-600">{errors.basicRate.message}</p>
                  )}
                </div>

                {/* Road */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Road
                  </label>
                  <input
                    {...register('road')}
                    type="text"
                    className="input"
                    placeholder="Enter road details"
                  />
                </div>

                {/* Facing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facing
                  </label>
                  <select {...register('facing')} className="input">
                    <option value="">Select Facing</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North East">North East</option>
                    <option value="North West">North West</option>
                    <option value="South East">South East</option>
                    <option value="South West">South West</option>
                  </select>
                </div>

                {/* Gata/Khesra No */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gata/Khesra No
                  </label>
                  <input
                    {...register('gataKhesraNo')}
                    type="text"
                    className="input"
                    placeholder="Enter Gata/Khesra number"
                  />
                </div>
              </div>
            </div>

            {/* PLC Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">PLC Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PLC Applicable */}
                <div>
                  <label className="flex items-center">
                    <input
                      {...register('plcApplicable')}
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">PLC Applicable</span>
                  </label>
                </div>

                {/* Type of PLC */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type of PLC
                  </label>
                  <input
                    {...register('typeofPLC')}
                    type="text"
                    className="input"
                    placeholder="Enter PLC type"
                  />
                </div>
              </div>
            </div>

            {/* Status & Description */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Status & Description</h4>
              <div className="space-y-4">
                {/* Available Plot */}
                <div>
                  <label className="flex items-center">
                    <input
                      {...register('availablePlot')}
                      type="checkbox"
                      defaultChecked={true}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available for Sale</span>
                  </label>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="input"
                    placeholder="Enter plot description (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                  'Create Plot'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePlotForm;