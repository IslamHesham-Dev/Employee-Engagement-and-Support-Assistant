import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import emailService from '../services/emailService';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Create employee account (HR only)
export const createEmployee = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, departmentId } = req.body;
        const userId = (req as any).userId;

        // Verify user is HR
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can create employee accounts' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate employee ID
        const employeeId = `EMP${Date.now()}`;

        // Create employee
        const employee = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                employeeId,
                role: 'EMPLOYEE',
                departmentId: departmentId || null,
                status: 'ACTIVE',
                language: 'ENGLISH'
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                role: true,
                status: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                createdAt: true
            }
        });

        console.log('Employee created successfully:', employee.email);

        // Send welcome email to new employee
        try {
            await emailService.sendWelcomeEmail(
                employee.id,
                employee.email,
                `${employee.firstName} ${employee.lastName}`,
                employee.role
            );
        } catch (error) {
            logger.error('Failed to send welcome email', {
                employeeId: employee.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        res.status(201).json({ message: 'Employee created successfully', employee });
    } catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({ error: 'Failed to create employee' });
    }
};

// Get all employees (HR only)
export const getAllEmployees = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        // Verify user is HR
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can view all employees' });
        }

        const employees = await prisma.user.findMany({
            where: {
                role: 'EMPLOYEE'
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                role: true,
                status: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                createdAt: true,
                lastLogin: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(employees);
    } catch (error) {
        console.error('Get all employees error:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
};

// Update employee (HR only)
export const updateEmployee = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        const { firstName, lastName, email, status, departmentId } = req.body;
        const userId = (req as any).userId;

        // Verify user is HR
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can update employees' });
        }

        // Check if employee exists
        if (!employeeId) {
            return res.status(400).json({ error: 'Employee ID is required' });
        }
        const employee = await prisma.user.findUnique({ where: { id: employeeId } });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        if (employee.role !== 'EMPLOYEE') {
            return res.status(400).json({ error: 'Can only update employee accounts' });
        }

        // Update employee
        const updatedEmployee = await prisma.user.update({
            where: { id: employeeId },
            data: {
                firstName: firstName || employee.firstName,
                lastName: lastName || employee.lastName,
                email: email || employee.email,
                status: status || employee.status,
                departmentId: departmentId !== undefined ? departmentId : employee.departmentId
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                role: true,
                status: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });

        res.json({ message: 'Employee updated successfully', employee: updatedEmployee });
    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
};

// Delete employee (HR only)
export const deleteEmployee = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        const userId = (req as any).userId;

        // Verify user is HR
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can delete employees' });
        }

        // Check if employee exists
        if (!employeeId) {
            return res.status(400).json({ error: 'Employee ID is required' });
        }
        const employee = await prisma.user.findUnique({ where: { id: employeeId } });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        if (employee.role !== 'EMPLOYEE') {
            return res.status(400).json({ error: 'Can only delete employee accounts' });
        }

        // Delete employee
        await prisma.user.delete({
            where: { id: employeeId }
        });

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
};
