
// FIX: Import explicit types from express.
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
const { Prisma } = require('@prisma/client');

// FIX: Add explicit types for Express middleware parameters.
export const errorHandler = (err: Error & { code?: string; meta?: any }, req: Request, res: Response, next: NextFunction) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.error(err);

    if (err instanceof ZodError) {
        return res.status(400).json({
            message: 'Invalid request data.',
            errors: err.issues.map(e => ({ path: e.path.join('.'), message: e.message })),
        });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (err.code === 'P2002') {
            const target = (err.meta?.target as string[])?.join(', ');
            return res.status(409).json({ message: `A record with this ${target} already exists.` });
        }
        // Record to update not found
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'The requested record was not found.' });
        }
    }
    
    // Default to 500 server error
    return res.status(500).json({
        message: 'An internal server error occurred.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
};
