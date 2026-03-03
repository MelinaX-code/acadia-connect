// API configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const token = localStorage.getItem('token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'API call failed');
    }

    return responseData;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth functions
async function registerUser(fullName, email, password, role) {
  try {
    const result = await apiCall('/auth/register', 'POST', {
      fullName,
      email,
      password,
      role,
    });

    // Save token to localStorage
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));

    return result;
  } catch (error) {
    throw error;
  }
}

async function loginUser(email, password) {
  try {
    const result = await apiCall('/auth/login', 'POST', {
      email,
      password,
    });

    // Save token to localStorage
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));

    return result;
  } catch (error) {
    throw error;
  }
}

function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function isUserLoggedIn() {
  return localStorage.getItem('token') !== null;
}

// Profile functions
async function getUserProfile() {
  try {
    return await apiCall('/profile/me', 'GET');
  } catch (error) {
    throw error;
  }
}

async function updateProfile(profileData) {
  try {
    return await apiCall('/profile/me', 'PUT', profileData);
  } catch (error) {
    throw error;
  }
}

async function getOtherUserProfile(userId) {
  try {
    return await apiCall(`/profile/${userId}`, 'GET');
  } catch (error) {
    throw error;
  }
}

// Generic fetch with authentication
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers
  });
}

// Admin functions
async function getAllUsers() {
  try {
    return await apiCall('/admin/users', 'GET');
  } catch (error) {
    throw error;
  }
}

async function getUserById(userId) {
  try {
    return await apiCall(`/admin/users/${userId}`, 'GET');
  } catch (error) {
    throw error;
  }
}

async function updateUser(userId, userData) {
  try {
    return await apiCall(`/admin/users/${userId}`, 'PUT', userData);
  } catch (error) {
    throw error;
  }
}

async function deleteUser(userId) {
  try {
    return await apiCall(`/admin/users/${userId}`, 'DELETE');
  } catch (error) {
    throw error;
  }
}

async function makeUserAdmin(userId) {
  try {
    return await apiCall(`/admin/users/${userId}/make-admin`, 'POST');
  } catch (error) {
    throw error;
  }
}

async function removeUserAdmin(userId) {
  try {
    return await apiCall(`/admin/users/${userId}/remove-admin`, 'POST');
  } catch (error) {
    throw error;
  }
}

async function getAdminStats() {
  try {
    return await apiCall('/admin/stats', 'GET');
  } catch (error) {
    throw error;
  }
}
