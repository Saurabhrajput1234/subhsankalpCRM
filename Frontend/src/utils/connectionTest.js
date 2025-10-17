import config from '../config';
import axios from 'axios';

export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection to:', config.apiBaseUrl);
    
    // Test basic connectivity
    const response = await axios.get(`${config.apiBaseUrl.replace('/api', '')}/swagger/v1/swagger.json`, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Backend connection successful:', response.status);
    return {
      success: true,
      status: response.status,
      message: 'Backend API is accessible'
    };
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    
    // Try HTTP if HTTPS fails
    if (error.code === 'ECONNREFUSED' || error.message.includes('certificate')) {
      try {
        const httpUrl = config.apiBaseUrl.replace('https:', 'http:');
        console.log('Trying HTTP connection to:', httpUrl);
        
        const httpResponse = await axios.get(`${httpUrl.replace('/api', '')}/swagger/v1/swagger.json`, {
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log('✅ HTTP Backend connection successful:', httpResponse.status);
        return {
          success: true,
          status: httpResponse.status,
          message: 'Backend API is accessible via HTTP',
          useHttp: true
        };
      } catch (httpError) {
        console.error('❌ HTTP Backend connection also failed:', httpError.message);
      }
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.response?.status
    };
  }
};

export const testApiEndpoint = async (endpoint = '/dashboard/stats') => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found'
      };
    }
    
    const response = await axios.get(`${config.apiBaseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('✅ API endpoint test successful:', endpoint);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('❌ API endpoint test failed:', endpoint, error.message);
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
};