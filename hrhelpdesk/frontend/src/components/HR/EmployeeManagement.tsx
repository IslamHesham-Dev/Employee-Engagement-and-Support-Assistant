import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Alert,
    Chip
} from '@mui/material';
import { Add, Edit, Delete, Person } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { createEmployee, fetchAllEmployees, deleteEmployee } from '../../store/userSlice';

const EmployeeManagement: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { employees, loading, error } = useSelector((state: RootState) => state.user);

    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        console.log('EmployeeManagement: Component mounted, fetching employees...');
        dispatch(fetchAllEmployees());
    }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await dispatch(createEmployee(formData));
        if (createEmployee.fulfilled.match(result)) {
            setOpen(false);
            setFormData({ firstName: '', lastName: '', email: '', password: '' });
        }
    };

    const handleDelete = async (employeeId: string) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            dispatch(deleteEmployee(employeeId));
        }
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" component="h2">
                        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Employee Management
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpen(true)}
                        sx={{ bgcolor: '#00B59D' }}
                    >
                        Add Employee
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Employee ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell>{employee.employeeId}</TableCell>
                                    <TableCell>{`${employee.firstName} ${employee.lastName}`}</TableCell>
                                    <TableCell>{employee.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={employee.status}
                                            color={employee.status === 'ACTIVE' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(employee.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" color="primary">
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(employee.id)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Add Employee Dialog */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                    <form onSubmit={handleSubmit}>
                        <DialogTitle>Add New Employee</DialogTitle>
                        <DialogContent>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="First Name"
                                fullWidth
                                variant="outlined"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                required
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                margin="dense"
                                label="Last Name"
                                fullWidth
                                variant="outlined"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                required
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                margin="dense"
                                label="Email"
                                type="email"
                                fullWidth
                                variant="outlined"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                margin="dense"
                                label="Password"
                                type="password"
                                fullWidth
                                variant="outlined"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                helperText="Temporary password that the employee can change later"
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpen(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{ bgcolor: '#00B59D' }}
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Employee'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default EmployeeManagement;
