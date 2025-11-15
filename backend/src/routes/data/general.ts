
import express, { Response, NextFunction } from 'express';
// FIX: Removed asyncHandler to fix type inference issues in route handlers.
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

const router = express.Router();

// --- LOGS ---
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.get('/logs/activity', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const logs = await prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
        res.json(logs);
    } catch (error) {
        next(error);
    }
});

// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.post('/logs/activity', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user?.userId }});
        if (!user) { res.status(404).json({ message: 'User not found' }); return; }
        if (!req.body.action) { res.status(400).json({ message: 'Action is required.' }); return; }
        
        await prisma.activityLog.create({ data: { action: req.body.action, adminName: user.name, timestamp: new Date().toISOString() } });
        const logs = await prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
        res.status(201).json(logs);
    } catch (error) {
        next(error);
    }
});

// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.get('/logs/payment', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const logs = await prisma.paymentActivityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
        res.json(logs);
    } catch (error) {
        next(error);
    }
});

// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.post('/logs/payment', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { text, amount, type } = req.body;
        if (!text || typeof amount !== 'number' || !type) {
            res.status(400).json({ message: 'Invalid payment log data.' });
            return;
        }
        await prisma.paymentActivityLog.create({ data: { ...req.body, timestamp: new Date().toISOString() } });
        const logs = await prisma.paymentActivityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
        res.status(201).json(logs);
    } catch (error) {
        next(error);
    }
});

// --- CONTACTS ---
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.get('/contacts', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const contacts = await prisma.contact.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(contacts);
    } catch (error) {
        next(error);
    }
});

// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.post('/contacts', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id, ...contactData } = req.body;
        if (!contactData.name || !contactData.email || !contactData.contactId) {
            res.status(400).json({ message: 'Valid name, email, and contact ID are required.' });
            return;
        }
        const newContact = await prisma.contact.create({ data: contactData });
        res.status(201).json(newContact);
    } catch (error) {
        next(error);
    }
});

// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.put('/contacts/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id, ...contactData } = req.body;
         if (!contactData.name || !contactData.email) {
            res.status(400).json({ message: 'Valid name and email are required.' });
            return;
        }
        const updatedContact = await prisma.contact.update({ where: { id: parseInt(req.params.id) }, data: contactData });
        res.json(updatedContact);
    } catch (error) {
        next(error);
    }
});

// --- TASKS ---
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.get('/tasks', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const tasks = await prisma.todoTask.findMany();
        res.json(tasks);
    } catch (error) {
        next(error);
    }
});

// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.post('/tasks', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { title, dueDate, status } = req.body;
        if (!title || !dueDate || !status) {
            res.status(400).json({ message: 'Title, due date, and status are required.' });
            return;
        }
        await prisma.todoTask.create({ data: req.body });
        const allTasks = await prisma.todoTask.findMany();
        res.status(201).json(allTasks);
    } catch (error) {
        next(error);
    }
});

// --- NOTIFICATIONS ---
// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.get('/notifications', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const notifications = await prisma.notification.findMany({ orderBy: { timestamp: 'desc' } });
        res.json(notifications);
    } catch (error) {
        next(error);
    }
});

// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.post('/notifications', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.body.title || !req.body.description) {
            res.status(400).json({ message: 'Title and description are required.' });
            return;
        }
        await prisma.notification.create({ data: { ...req.body, timestamp: new Date().toISOString() } });
        const notifications = await prisma.notification.findMany({ orderBy: { timestamp: 'desc' } });
        res.status(201).json(notifications);
    } catch (error) {
        next(error);
    }
});

// FIX: Removed asyncHandler and added try/catch with next() for error handling to resolve type issues.
router.post('/notifications/mark-all-read', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // A real app would target user-specific notifications
        await prisma.notification.updateMany({ data: { read: true } });
        const notifications = await prisma.notification.findMany({ orderBy: { timestamp: 'desc' } });
        res.json(notifications);
    } catch (error) {
        next(error);
    }
});

export default router;