import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('user'); // 'user' or 'customer'
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm();

  // Redirect if already authenticated
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    const isCustomer = loginType === 'customer';
    const result = await login(data, isCustomer);
    
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const switchLoginType = (type) => {
    setLoginType(type);
    reset();
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
            Subhsankalp CRM
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {/* Login Type Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => switchLoginType('user')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              loginType === 'user'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Admin / Associate
          </button>
          <button
            type="button"
            onClick={() => switchLoginType('customer')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              loginType === 'customer'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Customer
          </button>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {loginType === 'user' ? (
              <>
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    {...register('username', { required: 'Username is required' })}
                    type="text"
                    className="input mt-1"
                    placeholder="Enter your username"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('password', { required: 'Password is required' })}
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Enter your password"
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
              </>
            ) : (
              <>
                {/* Site Name */}
                <div>
                  <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                    Site Name
                  </label>
                  <input
                    {...register('siteName', { required: 'Site name is required' })}
                    type="text"
                    className="input mt-1"
                    placeholder="Enter site name"
                  />
                  {errors.siteName && (
                    <p className="mt-1 text-sm text-red-600">{errors.siteName.message}</p>
                  )}
                </div>

                {/* Plot Number */}
                <div>
                  <label htmlFor="plotNumber" className="block text-sm font-medium text-gray-700">
                    Plot Number
                  </label>
                  <input
                    {...register('plotNumber', { required: 'Plot number is required' })}
                    type="text"
                    className="input mt-1"
                    placeholder="Enter plot number"
                  />
                  {errors.plotNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.plotNumber.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('password', { required: 'Password is required' })}
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Enter your password"
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
              </>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full btn-lg flex justify-center"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Signup Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign up here
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          {loginType === 'user' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Admin:</strong> admin / Admin@123</p>
                <p><strong>Customer:</strong> Site Name + Plot Number + Plot{'<PlotNumber>'}</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;