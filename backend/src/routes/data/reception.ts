
import express, { Response, NextFunction } from 'express';
// FIX: Removed asyncHandler to fix type inference issues in route handlers.
import prisma from '../../lib/prisma';
import { validate } from '../../middleware/validate';
import { checkInSchema, scheduleVisitorSchema, updateVisitorSchema } from '../../schemas/receptionSchemas';
import { AuthRequest } from '../../middleware/auth';

const router = express.Router();

// GET /api/data/reception/visitors
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.get('/visitors', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const visitors = await prisma.visitor.findMany({ orderBy: { scheduledCheckIn: 'desc' } });
        res.json(visitors);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/reception/visitors/check-in
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.post('/visitors/check-in', validate(checkInSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, company, host, cardNumber } = req.body;
        await prisma.visitor.create({
            data: {
                name, company, host, cardNumber: cardNumber || null,
                status: 'CheckedIn',
                scheduledCheckIn: new Date().toISOString(),
                checkIn: new Date().toISOString()
            }
        });
        const allVisitors = await prisma.visitor.findMany({ orderBy: { scheduledCheckIn: 'desc' } });
        res.status(201).json(allVisitors);
    } catch (error) {
        next(error);
    }
});

// PUT /api/data/reception/visitors/:id
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.put('/visitors/:id', validate(updateVisitorSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, company, host, cardNumber } = req.body;
        await prisma.visitor.update({
            where: { id: parseInt(id) },
            data: { name, company, host, cardNumber: cardNumber || null }
        });
        const allVisitors = await prisma.visitor.findMany({ orderBy: { scheduledCheckIn: 'desc' } });
        res.json(allVisitors);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/reception/visitors/:id/checkout
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.post('/visitors/:id/checkout', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const checkedOutVisitor = await prisma.visitor.update({
            where: { id: parseInt(req.params.id) },
            data: { status: 'CheckedOut', checkOut: new Date().toISOString() }
        });
        const allVisitors = await prisma.visitor.findMany({ orderBy: { scheduledCheckIn: 'desc' } });
        res.json({ allVisitors, checkedOutVisitor });
    } catch (error) {
        next(error);
    }
});

// POST /api/data/reception/visitors/schedule
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.post('/visitors/schedule', validate(scheduleVisitorSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { scheduledCheckIn } = req.body;
        if (new Date(scheduledCheckIn) < new Date()) {
            res.status(400).json({ message: 'Scheduled time cannot be in the past.' });
            return;
        }
        await prisma.visitor.create({ data: { ...req.body, status: 'Scheduled' } });
        const allVisitors = await prisma.visitor.findMany({ orderBy: { scheduledCheckIn: 'desc' } });
        res.status(201).json(allVisitors);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/reception/visitors/:id/check-in
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.post('/visitors/:id/check-in', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const checkedInVisitor = await prisma.visitor.update({
            where: { id: parseInt(req.params.id) },
            data: { status: 'CheckedIn', checkIn: new Date().toISOString() }
        });
        const allVisitors = await prisma.visitor.findMany({ orderBy: { scheduledCheckIn: 'desc' } });
        res.json({ allVisitors, checkedInVisitor });
    } catch (error) {
        next(error);
    }
});

export default router;