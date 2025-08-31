import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: string;
    role: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
        (req as any).userId = decoded.userId;
        (req as any).userRole = decoded.role;

        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};
