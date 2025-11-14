import express = require('express');
// FIX: Changed require to import for PrismaClient to resolve module resolution issues with TypeScript.
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const handleError = (res: express.Response, error: any, context: string) => {
    console.error(`Error in /data route for ${context}:`, error);
    res.status(500).json({ message: `Internal server error while fetching ${context}.` });
}

// GET all data types for initial load

router.get('/users', async (req: express.Request, res: express.Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
        });
        res.json(users);
    } catch (error) { handleError(res, error, 'users'); }
});

router.get('/contacts', async (req: express.Request, res: express.Response) => {
    try {
        const contacts = await prisma.contact.findMany();
        res.json(contacts);
    } catch (error) { handleError(res, error, 'contacts'); }
});

router.get('/lms/courses', async (req: express.Request, res: express.Response) => {
    try {
        const courses = await prisma.lmsCourse.findMany({
            include: {
                modules: { include: { lessons: true } },
                discussions: { include: { posts: true } }
            }
        });
        res.json(courses);
    } catch (error) { handleError(res, error, 'LMS courses'); }
});

router.get('/crm/leads', async (req: express.Request, res: express.Response) => {
    try {
        const leads = await prisma.crmLead.findMany({ include: { quotations: true }});
        res.json(leads);
    } catch (error) { handleError(res, error, 'CRM leads'); }
});

router.get('/logs/activity', async (req: express.Request, res: express.Response) => {
    try {
        const logs = await prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
        res.json(logs);
    } catch (error) { handleError(res, error, 'activity logs'); }
});

router.get('/logs/payment', async (req: express.Request, res: express.Response) => {
    try {
        const logs = await prisma.paymentActivityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
        res.json(logs);
    } catch (error) { handleError(res, error, 'payment logs'); }
});

router.get('/accounting/transactions', async (req: express.Request, res: express.Response) => {
    try {
        const transactions = await prisma.accountingTransaction.findMany({ orderBy: { date: 'desc' } });
        res.json(transactions);
    } catch (error) { handleError(res, error, 'transactions'); }
});

router.get('/crm/quotation-templates', async (req: express.Request, res: express.Response) => {
    try {
        const templates = await prisma.quotationTemplate.findMany();
        res.json(templates);
    } catch (error) { handleError(res, error, 'quotation templates'); }
});

router.get('/reception/visitors', async (req: express.Request, res: express.Response) => {
    try {
        const visitors = await prisma.visitor.findMany({ orderBy: { scheduledCheckIn: 'desc' } });
        res.json(visitors);
    } catch (error) { handleError(res, error, 'visitors'); }
});

router.get('/tasks', async (req: express.Request, res: express.Response) => {
    try {
        const tasks = await prisma.todoTask.findMany();
        res.json(tasks);
    } catch (error) { handleError(res, error, 'tasks'); }
});

router.get('/calendar/events', async (req: express.Request, res: express.Response) => {
    try {
        const events = await prisma.calendarEvent.findMany();
        res.json(events);
    } catch (error) { handleError(res, error, 'calendar events'); }
});

router.get('/discuss/channels', async (req: express.Request, res: express.Response) => {
    try {
        // This is a simplified implementation. A real chat app would have more complex logic.
        const channels = await prisma.channel.findMany();
        res.json(channels);
    } catch (error) { handleError(res, error, 'channels'); }
});

router.get('/lms/coupons', async (req: express.Request, res: express.Response) => {
    try {
        const coupons = await prisma.coupon.findMany();
        res.json(coupons);
    } catch (error) { handleError(res, error, 'coupons'); }
});

router.get('/notifications', async (req: express.Request, res: express.Response) => {
    try {
        const notifications = await prisma.notification.findMany({ orderBy: { timestamp: 'desc' } });
        res.json(notifications);
    } catch (error) { handleError(res, error, 'notifications'); }
});


export default router;