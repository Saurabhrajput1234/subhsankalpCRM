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
      
      const response = await plotsAPI.createPlot(data);
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

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Add New Plot</h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
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

            {/* Plot Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plot Size *
              </label>
              <input
                {...register('plotSize', { required: 'Plot size is required' })}
                type="text"
                className="input"
                placeholder="e.g., 1000 sq ft, 500 sq yd"
              />
              {errors.plotSize && (
                <p className="mt-1 text-sm text-red-600">{errors.plotSize.message}</p>
              )}
            </div>

            {/* Basic Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Basic Rate (₹ per sq ft/yd) *
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