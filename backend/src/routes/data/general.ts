
import express, { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

const router = express.Router();

// --- LOGS ---
router.get('/logs/activity', asyncHandler(async (req: Request, res: Response) => {
    const logs = await prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
    res.json(logs);
}));

router.post('/logs/activity', asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({ where: { id: req.user?.userId }});
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    if (!req.body.action) { res.status(400).json({ message: 'Action is required.' }); return; }
    
    await prisma.activityLog.create({ data: { action: req.body.action, adminName: user.name, timestamp: new Date().toISOString() } });
    const logs = await prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
    res.status(201).json(logs);
}));

router.get('/logs/payment', asyncHandler(async (req: Request, res: Response) => {
    const logs = await prisma.paymentActivityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
    res.json(logs);
}));

router.post('/logs/payment', asyncHandler(async (req: Request, res: Response) => {
    const { text, amount, type } = req.body;
    if (!text || typeof amount !== 'number' || !type) {
        res.status(400).json({ message: 'Invalid payment log data.' });
        return;
    }
    await prisma.paymentActivityLog.create({ data: { ...req.body, timestamp: new Date().toISOString() } });
    const logs = await prisma.paymentActivityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
    res.status(201).json(logs);
}));

// --- CONTACTS ---
router.get('/contacts', asyncHandler(async (req: Request, res: Response) => {
    const contacts = await prisma.contact.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(contacts);
}));

router.post('/contacts', asyncHandler(async (req: Request, res: Response) => {
    const { id, ...contactData } = req.body;
    if (!contactData.name || !contactData.email || !contactData.contactId) {
        res.status(400).json({ message: 'Valid name, email, and contact ID are required.' });
        return;
    }
    const newContact = await prisma.contact.create({ data: contactData });
    res.status(201).json(newContact);
}));

router.put('/contacts/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id, ...contactData } = req.body;
     if (!contactData.name || !contactData.email) {
        res.status(400).json({ message: 'Valid name and email are required.' });
        return;
    }
    const updatedContact = await prisma.contact.update({ where: { id: parseInt(req.params.id) }, data: contactData });
    res.json(updatedContact);
}));

// --- TASKS ---
router.get('/tasks', asyncHandler(async (req: Request, res: Response) => {
    const tasks = await prisma.todoTask.findMany();
    res.json(tasks);
}));

router.post('/tasks', asyncHandler(async (req: Request, res: Response) => {
    const { title, dueDate, status } = req.body;
    if (!title || !dueDate || !status) {
        res.status(400).json({ message: 'Title, due date, and status are required.' });
        return;
    }
    await prisma.todoTask.create({ data: req.body });
    const allTasks = await prisma.todoTask.findMany();
    res.status(201).json(allTasks);
}));

// --- NOTIFICATIONS ---
router.get('/notifications', asyncHandler(async (req: Request, res: Response) => {
    const notifications = await prisma.notification.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(notifications);
}));

router.post('/notifications', asyncHandler(async (req: Request, res: Response) => {
    if (!req.body.title || !req.body.description) {
        res.status(400).json({ message: 'Title and description are required.' });
        return;
    }
    await prisma.notification.create({ data: { ...req.body, timestamp: new Date().toISOString() } });
    const notifications = await prisma.notification.findMany({ orderBy: { timestamp: 'desc' } });
    res.status(201).json(notifications);
}));

router.post('/notifications/mark-all-read', asyncHandler(async (req: Request, res: Response) => {
    // A real app would target user-specific notifications
    await prisma.notification.updateMany({ data: { read: true } });
    const notifications = await prisma.notification.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(notifications);
}));

export default router;
