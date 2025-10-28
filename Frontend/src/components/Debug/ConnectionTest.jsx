import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import config from '../../config';
import axios from 'axios';

const ConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    setApiResponse(null);

    try {
      // Test basic API connection - try swagger JSON endpoint first
      const response = await axios.get(`${config.apiBaseUrl.replace('/api', '')}/swagger/v1/swagger.json`, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      setConnectionStatus('connected');
      setApiResponse({
        status: response.status,
        message: `Backend API is running on port 5007 and accessible`
      });
    } catch (err) {
      // If HTTPS fails, try HTTP
      try {
        const httpUrl = config.apiBaseUrl.replace('https:', 'http:');
        const httpResponse = await axios.get(`${httpUrl.replace('/api', '')}/swagger/v1/swagger.json`, {
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        setConnectionStatus('connected');
        setApiResponse({
          status: httpResponse.status,
          message: `Backend API is running on port 5007 and accessible`
        });
      } catch (httpErr) {
        setConnectionStatus('error');
        setError({
          message: `Cannot connect to backend. ${err.message}`,
          code: err.code,
          status: err.response?.status,
          suggestion: `Make sure the backend is running on ${config.apiBaseUrl.replace('/api', '')}`
        });
      }
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
      case 'connected':
        return <Wifi className="h-5 w-5 text-green-500" />;
      case 'error':
        return <WifiOff className="h-5 w-5 text-red-500" />;
      default:
        return <Wifi className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'testing':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (!config.enableDebug) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg border-2 ${getStatusColor()} shadow-lg max-w-sm`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">Backend Connection</span>
        </div>
        <button
          onClick={testConnection}
          disabled={connectionStatus === 'testing'}
          className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Test
        </button>
      </div>
      
      <div className="text-xs text-gray-600 space-y-1">
        <div>API URL: {config.apiBaseUrl}</div>
        <div>Environment: {config.nodeEnv}</div>
        
        {apiResponse && (
          <div className="mt-2 p-2 bg-green-100 rounded text-green-800">
            ✓ {apiResponse.message}
          </div>
        )}
        
        {error && (
          <div className="mt-2 p-2 bg-red-100 rounded text-red-800">
            ✗ {error.message}
            {error.status && <div>Status: {error.status}</div>}
            {error.suggestion && <div className="mt-1 text-xs">{error.suggestion}</div>}
          </div>
        )}
      </div>
      
      {config.enableSwagger && (
        <div className="mt-2">
          <a
            href={config.swaggerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Open Swagger UI
          </a>
        </div>
      )}
    </div>
  );
};

export default ConnectionTest;