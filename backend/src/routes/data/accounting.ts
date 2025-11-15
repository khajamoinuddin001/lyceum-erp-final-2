

import express from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../lib/prisma';

const router = express.Router();

// GET /api/data/accounting/transactions
router.get('/transactions', asyncHandler(async (req: express.Request, res: express.Response) => {
    const transactions = await prisma.accountingTransaction.findMany({ orderBy: { date: 'desc' } });
    res.json(transactions);
}));

// POST /api/data/accounting/invoices
router.post('/invoices', asyncHandler(async (req: express.Request, res: express.Response) => {
    const { customerName, amount, ...rest } = req.body;
    // Further validation could be added with Zod
    if (!customerName || typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ message: 'Valid customer name and a positive amount are required.' });
        return;
    }
    const transaction = await prisma.accountingTransaction.create({ data: { ...req.body, id: `INV-${Date.now()}` } });
    const allTransactions = await prisma.accountingTransaction.findMany({ orderBy: { date: 'desc' } });
    res.status(201).json({ transaction, allTransactions });
}));

// POST /api/data/accounting/invoices/:id/record-payment
router.post('/invoices/:id/record-payment', asyncHandler(async (req: express.Request, res: express.Response) => {
    const paidTransaction = await prisma.accountingTransaction.update({ where: { id: req.params.id }, data: { status: 'Paid' } });
    const allTransactions = await prisma.accountingTransaction.findMany({ orderBy: { date: 'desc' } });
    res.json({ allTransactions, paidTransaction });
}));

export default router;
