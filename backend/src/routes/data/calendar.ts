import express, { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

const router = express.Router();

// GET /api/data/calendar/events
router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const events = await prisma.calendarEvent.findMany();
        res.json(events);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/calendar/events
router.post('/events', async (req: Request, res: Response, next: NextFunction) => {
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
router.put('/events/:id', async (req: Request, res: Response, next: NextFunction) => {
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
router.delete('/events/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.calendarEvent.delete({ where: { id: parseInt(req.params.id) } });
        const allEvents = await prisma.calendarEvent.findMany();
        res.json(allEvents);
    } catch (error) {
        next(error);
    }
});

export default router;