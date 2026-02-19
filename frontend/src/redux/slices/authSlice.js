import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';
import toast from 'react-hot-toast';

// Get user from localStorage
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

const initialState = {
  user: user || null,
  token: token || null,
  isLoading: false,
  isAuthenticated: token ? true : false, // ✅ FIXED
  error: null,
};

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // console.log("<-----REGISTRATION----->")
      // console.log("User Name:", response.data.user.name);
      // console.log("User ID:", response.data.user.id);
      // console.log("Whole User Data:", response.data.user);
      
      toast.success('Registration successful!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      return rejectWithValue(error.response?.data || { message: errorMessage });
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // console.log("<-----LOGIN----->")
      // console.log("User Name:", response.data.user.name);
      // console.log("User ID:", response.data.user.id);
      // console.log("Full Response:", response.data);
      
      toast.success('Login successful!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      return rejectWithValue(error.response?.data || { message: errorMessage });
    }
  }
);

// Get current user
export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      // console.log("<-----GET ME----->", response.data);
      return response.data;
    } catch (error) {
      console.error("Get Me Error:", error.response?.data);
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch user data' });
    }
  }
);

// Logout user
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.get('/auth/logout');
      toast.success('Logged out successfully!');
      return null;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Update profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/updateprofile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // console.log("<-----PROFILE----->")
      // console.log("User Name:", response.data.data.name);
      // console.log("User ID:", response.data.data._id);
      // console.log("Whole User Data:", response.data.data);
      
      toast.success('Profile updated successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      toast.error(errorMessage);
      return rejectWithValue(error.response?.data || { message: errorMessage });
    }
  }
);

// Update password
export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/updatepassword', passwordData);
      toast.success('Password updated successfully!');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Registration failed';
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      // Get Me
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload.data;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.data));
      })
      .addCase(getMe.rejected, (state) => {
        // Clear invalid credentials
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        localStorage.setItem('user', JSON.stringify(action.payload.data));
      })
      .addCase(updateProfile.rejected, (state) => {
        state.isLoading = false;
      })
      // Update Password
      .addCase(updatePassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(updatePassword.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { clearError, setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;