import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface Employee {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    role: string;
    status: 'ACTIVE' | 'INACTIVE';
    department?: {
        id: string;
        name: string;
        code: string;
    };
    createdAt: string;
    lastLogin?: string;
}

interface UserState {
    employees: Employee[];
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    employees: [],
    loading: false,
    error: null,
};

// Async thunks
export const createEmployee = createAsyncThunk(
    'user/createEmployee',
    async (employeeData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        departmentId?: string;
    }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/users/employees`, employeeData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.employee;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to create employee');
        }
    }
);

export const fetchAllEmployees = createAsyncThunk(
    'user/fetchAllEmployees',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Frontend: Fetching employees...');
            const token = localStorage.getItem('token');
            console.log('Frontend: Token exists:', !!token);

            const response = await axios.get(`${API_BASE_URL}/users/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Frontend: Employees response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Frontend: Fetch employees error:', error);
            console.error('Frontend: Error response:', error.response?.data);
            console.error('Frontend: Error status:', error.response?.status);
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch employees');
        }
    }
);

export const updateEmployee = createAsyncThunk(
    'user/updateEmployee',
    async ({ employeeId, data }: { employeeId: string; data: Partial<Employee> }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_BASE_URL}/users/employees/${employeeId}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.employee;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to update employee');
        }
    }
);

export const deleteEmployee = createAsyncThunk(
    'user/deleteEmployee',
    async (employeeId: string, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/users/employees/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return employeeId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to delete employee');
        }
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create employee
            .addCase(createEmployee.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createEmployee.fulfilled, (state, action) => {
                state.loading = false;
                state.employees.unshift(action.payload);
            })
            .addCase(createEmployee.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch employees
            .addCase(fetchAllEmployees.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllEmployees.fulfilled, (state, action) => {
                state.loading = false;
                state.employees = action.payload;
            })
            .addCase(fetchAllEmployees.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Update employee
            .addCase(updateEmployee.fulfilled, (state, action) => {
                const index = state.employees.findIndex(emp => emp.id === action.payload.id);
                if (index !== -1) {
                    state.employees[index] = action.payload;
                }
            })
            // Delete employee
            .addCase(deleteEmployee.fulfilled, (state, action) => {
                state.employees = state.employees.filter(emp => emp.id !== action.payload);
            });
    },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
