

import express from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../lib/prisma';
import { validate } from '../../middleware/validate';
import { checkInSchema, scheduleVisitorSchema, updateVisitorSchema } from '../../schemas/receptionSchemas';

const router = express.Router();

// GET /api/data/reception/visitors
router.get('/visitors', asyncHandler(async (req: express.Request, res: express.Response) => {
    const visitors = await prisma.visitor.findMany({ orderBy: { scheduledCheckIn: 'desc' } });
    res.json(visitors);
}));

// POST /api/data/reception/visitors/check-in
router.post('/visitors/check-in', validate(checkInSchema), asyncHandler(async (req: express.Request, res: express.Response) => {
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
}));

// PUT /api/data/reception/visitors/:id
router.put('/visitors/:id', validate(updateVisitorSchema), asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { name, company, host, cardNumber } = req.body;
    await prisma.visitor.update({
        where: { id: parseInt(id) },
        data: { name, company, host, cardNumber: cardNumber || null }
    });
    const allVisitors = await prisma.visitor.findMany({ orderBy: { scheduledCheckIn: 'desc' } });
    res.json(allVisitors);
}));

// POST /api/data/reception/visitors/:id/checkout
router.post('/visitors/:id/checkout', asyncHandler(async (req: express.Request, res: express.Response) => {
    const checkedOutVisitor = await prisma.visitor.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'CheckedOut', checkOut: new Date().toISOString() }
    });
    const allVisitors = await prisma.visitor.findMany({ orderBy: { scheduledCheckIn: 'desc' } });
    res.json({ allVisitors, checkedOutVisitor });
}));

// POST /api/data/reception/visitors/schedule
router.post('/visitors/schedule', validate(scheduleVisitorSchema), asyncHandler(async (req: express.Request, res: express.Response) => {
    const { scheduledCheckIn } = req.body;
    if (new Date(scheduledCheckIn) < new Date()) {
        res.status(400).json({ message: 'Scheduled time cannot be in the past.' });
        return;
    }
    await prisma.visitor.create({ data: { ...req.body, status: 'Scheduled' } });
    const allVisitors = await prisma.visitor.findMany({ orderBy: { scheduledCheckIn: 'desc' } });
    res.status(201).json(allVisitors);
}));

// POST /api/data/reception/visitors/:id/check-in
router.post('/visitors/:id/check-in', asyncHandler(async (req: express.Request, res: express.Response) => {
    const checkedInVisitor = await prisma.visitor.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'CheckedIn', checkIn: new Date().toISOString() }
    });
    const allVisitors = await prisma.visitor.findMany({ orderBy: { scheduledCheckIn: 'desc' } });
    res.json({ allVisitors, checkedInVisitor });
}));

export default router;
