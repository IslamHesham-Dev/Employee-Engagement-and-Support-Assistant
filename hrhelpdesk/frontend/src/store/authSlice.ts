import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    employeeId: string;
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    isAuthenticated: !!localStorage.getItem('token'),
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
    'auth/login',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            console.log('Frontend: Attempting login for:', email);
            console.log('Frontend: API URL:', `${API_BASE_URL}/auth/login`);

            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email,
                password,
            });

            console.log('Frontend: Login response:', response.data);

            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            return { token, user };
        } catch (error: any) {
            console.error('Frontend: Login error:', error);
            console.error('Frontend: Error response:', error.response?.data);
            console.error('Frontend: Error status:', error.response?.status);
            return rejectWithValue(error.response?.data?.error || 'Login failed');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        employeeId: string;
        role: string;
    }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

            const { user } = response.data;
            return { user };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Registration failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login cases
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Register cases
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                // Don't auto-login after registration
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
