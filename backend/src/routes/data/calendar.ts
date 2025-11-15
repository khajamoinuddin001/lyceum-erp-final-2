
import express, { Response, NextFunction } from 'express';
// FIX: Removed asyncHandler to fix type inference issues in route handlers.
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

const router = express.Router();

// GET /api/data/calendar/events
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.get('/events', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const events = await prisma.calendarEvent.findMany();
        res.json(events);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/calendar/events
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.post('/events', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { title, start, end, ...rest } = req.body;
        if (!title || !start || !end) {
            res.status(400).json({ message: 'Title, start, and end times are required.' });
            return;
        }
        await prisma.calendarEvent.create({ data: { ...rest, title, start: new Date(start), end: new Date(end) } });
        const allEvents = await prisma.calendarEvent.findMany();
        res.status(201).json(allEvents);
    } catch (error) {
        next(error);
    }
});

// PUT /api/data/calendar/events/:id
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.put('/events/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id, title, start, end, ...rest } = req.body;
        if (!title || !start || !end) {
            res.status(400).json({ message: 'Title, start, and end times are required.' });
            return;
        }
        await prisma.calendarEvent.update({ where: { id: parseInt(req.params.id) }, data: { ...rest, title, start: new Date(start), end: new Date(end) } });
        const allEvents = await prisma.calendarEvent.findMany();
        res.json(allEvents);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/data/calendar/events/:id
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.delete('/events/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await prisma.calendarEvent.delete({ where: { id: parseInt(req.params.id) } });
        const allEvents = await prisma.calendarEvent.findMany();
        res.json(allEvents);
    } catch (error) {
        next(error);
    }
});

export default router;