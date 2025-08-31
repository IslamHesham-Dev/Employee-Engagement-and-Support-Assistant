import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Link,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../store/store';
import { registerUser, clearError } from '../store/authSlice';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
    });
    const [validationError, setValidationError] = useState('');

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        setValidationError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(clearError());

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setValidationError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setValidationError('Password must be at least 6 characters');
            return;
        }

        const { confirmPassword, ...userData } = formData;

        // Add default values for employee registration
        const employeeData = {
            ...userData,
            employeeId: `EMP${Date.now()}`, // Auto-generate employee ID
            role: 'EMPLOYEE'
        };

        const result = await dispatch(registerUser(employeeData));
        if (registerUser.fulfilled.match(result)) {
            // Show success message and redirect to login
            navigate('/login');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Join HRHelpDesk
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Create your account to get started
                    </Typography>
                </Box>

                {(error || validationError) && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error || validationError}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            label="First Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </Box>

                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        margin="normal"
                        required
                        autoComplete="email"
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        margin="normal"
                        required
                        autoComplete="new-password"
                    />

                    <TextField
                        fullWidth
                        label="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        margin="normal"
                        required
                        autoComplete="new-password"
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </form>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="body2">
                        Already have an account?{' '}
                        <Link
                            component="button"
                            variant="body2"
                            onClick={() => navigate('/login')}
                            sx={{ textDecoration: 'none' }}
                        >
                            Sign in here
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default Register;



