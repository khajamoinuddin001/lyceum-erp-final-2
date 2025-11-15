
import express, { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../lib/prisma';

const router = express.Router();

// GET /api/data/calendar/events
// FIX: Add explicit Request and Response types to the route handler.
router.get('/events', asyncHandler(async (req: Request, res: Response) => {
    const events = await prisma.calendarEvent.findMany();
    res.json(events);
}));

// POST /api/data/calendar/events
// FIX: Add explicit Request and Response types to the route handler.
router.post('/events', asyncHandler(async (req: Request, res: Response) => {
    const { title, start, end, ...rest } = req.body;
    if (!title || !start || !end) {
        res.status(400).json({ message: 'Title, start, and end times are required.' });
        return;
    }
    await prisma.calendarEvent.create({ data: { ...rest, title, start: new Date(start), end: new Date(end) } });
    const allEvents = await prisma.calendarEvent.findMany();
    res.status(201).json(allEvents);
}));

// PUT /api/data/calendar/events/:id
// FIX: Add explicit Request and Response types to the route handler.
router.put('/events/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id, title, start, end, ...rest } = req.body;
    if (!title || !start || !end) {
        res.status(400).json({ message: 'Title, start, and end times are required.' });
        return;
    }
    await prisma.calendarEvent.update({ where: { id: parseInt(req.params.id) }, data: { ...rest, title, start: new Date(start), end: new Date(end) } });
    const allEvents = await prisma.calendarEvent.findMany();
    res.json(allEvents);
}));

// DELETE /api/data/calendar/events/:id
// FIX: Add explicit Request and Response types to the route handler.
router.delete('/events/:id', asyncHandler(async (req: Request, res: Response) => {
    await prisma.calendarEvent.delete({ where: { id: parseInt(req.params.id) } });
    const allEvents = await prisma.calendarEvent.findMany();
    res.json(allEvents);
}));

export default router;
