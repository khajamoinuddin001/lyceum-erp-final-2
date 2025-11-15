import express from 'express';
import crmRoutes from './data/crm';
import lmsRoutes from './data/lms';
import accountingRoutes from './data/accounting';
import receptionRoutes from './data/reception';
import calendarRoutes from './data/calendar';
import discussRoutes from './data/discuss';
import generalRoutes from './data/general';

const router = express.Router();

// Delegate to resource-specific routers
router.use('/crm', crmRoutes);
router.use('/lms', lmsRoutes);
router.use('/accounting', accountingRoutes);
router.use('/reception', receptionRoutes);
router.use('/calendar', calendarRoutes);
router.use('/discuss', discussRoutes);
router.use('/', generalRoutes); // For general resources like tasks, notifications, etc.

export default router;
