// Auth utility functions
export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeUser = () => {
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const getUserRole = () => {
  const user = getUser();
  return user?.role || null;
};

export const isAdmin = () => {
  return getUserRole() === 'Admin';
};

export const isAssociate = () => {
  return getUserRole() === 'Associate';
};

export const isCustomer = () => {
  return getUserRole() === 'Customer';
};

export const logout = () => {
  removeToken();
  removeUser();
  window.location.href = '/login';
};