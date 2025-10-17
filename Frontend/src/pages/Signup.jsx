import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Building2, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import config from '../config';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm();

  const watchedRole = watch('role', 'Associate');

  // Redirect if already authenticated
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    const result = await signup(data);
    
    if (result.success) {
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Building2 className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join Our Team
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your account to start managing real estate
          </p>
        </div>

        {/* Signup Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                {...register('fullName', { required: 'Full name is required' })}
                type="text"
                className="input mt-1"
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username *
              </label>
              <input
                {...register('username', { 
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' }
                })}
                type="text"
                className="input mt-1"
                placeholder="Choose a username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address'
                  }
                })}
                type="email"
                className="input mt-1"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                Mobile Number *
              </label>
              <input
                {...register('mobile', { 
                  required: 'Mobile number is required',
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Enter a valid 10-digit mobile number starting with 6-9'
                  }
                })}
                type="tel"
                className="input mt-1"
                placeholder="Enter your mobile number"
              />
              {errors.mobile && (
                <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role *
              </label>
              <select
                {...register('role', { required: 'Role is required' })}
                className="input mt-1"
              >
                <option value="Associate">Associate</option>
                <option value="Admin">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Company Secret Key */}
            <div>
              <label htmlFor="companySecretKey" className="block text-sm font-medium text-gray-700">
                Company Secret Key *
              </label>
              <input
                {...register('companySecretKey', { required: 'Company secret key is required' })}
                type="password"
                className="input mt-1"
                placeholder="Enter company secret key"
              />
              {errors.companySecretKey && (
                <p className="mt-1 text-sm text-red-600">{errors.companySecretKey.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Contact your administrator for the company secret key
              </p>
            </div>
          </div>

          {/* Role Description */}
          <div className="p-4 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              {watchedRole} Role Permissions:
            </h4>
            <div className="text-xs text-blue-700 space-y-1">
              {watchedRole === 'Associate' ? (
                <>
                  <p>• Create and manage token receipts</p>
                  <p>• View available plots</p>
                  <p>• Track your own receipts and performance</p>
                </>
              ) : (
                <>
                  <p>• Full system access and management</p>
                  <p>• Approve/reject token receipts</p>
                  <p>• Manage plots, users, and system settings</p>
                  <p>• Access analytics and reports</p>
                </>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full btn-lg flex justify-center"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Create Account
                </>
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Company Secret Key Info */}
          {config.enableDebug && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Company Secret Key:</h4>
              <p className="text-xs text-yellow-700">
                <strong>{config.companySecretKey}</strong>
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                (This is shown for demo purposes only)
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Signup;