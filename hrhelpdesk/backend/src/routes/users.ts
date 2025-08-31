import { Router } from 'express';
import {
    createEmployee,
    getAllEmployees,
    updateEmployee,
    deleteEmployee
} from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

export const userRoutes = Router();

// All user management routes require authentication
userRoutes.use(authMiddleware);

// Employee management (HR only)
userRoutes.post('/employees', createEmployee);
userRoutes.get('/employees', getAllEmployees);
userRoutes.put('/employees/:employeeId', updateEmployee);
userRoutes.delete('/employees/:employeeId', deleteEmployee);
