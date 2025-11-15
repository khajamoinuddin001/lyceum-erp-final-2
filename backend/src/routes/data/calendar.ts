
import express from 'express';
import prisma from '../../lib/prisma';

const router = express.Router();

// GET /api/data/calendar/events
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.get('/events', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const events = await prisma.calendarEvent.findMany();
        res.json(events);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/calendar/events
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.post('/events', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.put('/events/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.delete('/events/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        await prisma.calendarEvent.delete({ where: { id: parseInt(req.params.id) } });
        const allEvents = await prisma.calendarEvent.findMany();
        res.json(allEvents);
    } catch (error) {
        next(error);
    }
});

export default router;
