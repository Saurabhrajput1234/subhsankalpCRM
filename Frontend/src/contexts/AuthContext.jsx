import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'INITIALIZE':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.token,
        isLoading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Initialize auth state from localStorage
    const token = getToken();
    const user = getUser();
    
    dispatch({
      type: 'INITIALIZE',
      payload: { user, token },
    });
  }, []);

  const login = async (credentials, isCustomer = false) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = isCustomer 
        ? await authAPI.customerLogin(credentials)
        : await authAPI.login(credentials);
      
      const { token, role, fullName, userId } = response.data;
      
      const userData = {
        id: userId,
        name: fullName,
        role,
        isCustomer,
      };
      
      setToken(token);
      setUser(userData);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: userData, token },
      });
      
      toast.success(`Welcome back, ${fullName}!`);
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const signup = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authAPI.signup(userData);
      const { token, role, fullName, userId } = response.data;
      
      const user = {
        id: userId,
        name: fullName,
        role,
        isCustomer: false,
      };
      
      setToken(token);
      setUser(user);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });
      
      toast.success(`Account created successfully! Welcome, ${fullName}!`);
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.message || error.response?.data || 'Signup failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    removeToken();
    removeUser();
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const value = {
    ...state,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};