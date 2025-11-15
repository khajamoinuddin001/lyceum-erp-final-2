

// FIX: Import Request, Response types from express
import express, { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../lib/prisma';
import { validate } from '../../middleware/validate';
import { createLeadSchema, updateLeadSchema, updateLeadStageSchema, createQuotationSchema, updateQuotationSchema } from '../../schemas/crmSchemas';

const router = express.Router();

// GET /api/data/crm/leads
router.get('/leads', asyncHandler(async (req: Request, res: Response) => {
    const leads = await prisma.crmLead.findMany({ include: { quotations: true }, orderBy: { createdAt: 'desc' } });
    res.json(leads);
}));

// POST /api/data/crm/leads
router.post('/leads', validate(createLeadSchema), asyncHandler(async (req: Request, res: Response) => {
    const { id, quotations, ...leadData } = req.body;
    const newLead = await prisma.crmLead.create({ data: { ...leadData, stage: 'New', createdAt: new Date() } });
    res.status(201).json(newLead);
}));

// PUT /api/data/crm/leads/:id
router.put('/leads/:id', validate(updateLeadSchema), asyncHandler(async (req: Request, res: Response) => {
    const { id, quotations, ...leadData } = req.body;
    const updatedLead = await prisma.crmLead.update({ where: { id: parseInt(req.params.id) }, data: leadData });
    const leadWithRelations = await prisma.crmLead.findUnique({ where: { id: updatedLead.id }, include: { quotations: true }});
    res.json(leadWithRelations);
}));

// PUT /api/data/crm/leads/:id/stage
router.put('/leads/:id/stage', validate(updateLeadStageSchema), asyncHandler(async (req: Request, res: Response) => {
    const { stage } = req.body;
    await prisma.crmLead.update({ where: { id: parseInt(req.params.id) }, data: { stage } });
    const allLeads = await prisma.crmLead.findMany({ include: { quotations: true }, orderBy: { createdAt: 'desc' }});
    res.json(allLeads);
}));

// GET /api/data/crm/quotation-templates
router.get('/quotation-templates', asyncHandler(async (req: Request, res: Response) => {
    const templates = await prisma.quotationTemplate.findMany();
    res.json(templates);
}));

// POST /api/data/crm/quotation-templates
router.post('/quotation-templates', asyncHandler(async (req: Request, res: Response) => {
    const { id, ...templateData } = req.body;
    // Add Zod validation here if needed
    await prisma.quotationTemplate.create({ data: templateData });
    const templates = await prisma.quotationTemplate.findMany();
    res.status(201).json(templates);
}));

// PUT /api/data/crm/quotation-templates/:id
router.put('/quotation-templates/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id, ...templateData } = req.body;
    await prisma.quotationTemplate.update({ where: { id: parseInt(req.params.id) }, data: templateData });
    const templates = await prisma.quotationTemplate.findMany();
    res.json(templates);
}));

// DELETE /api/data/crm/quotation-templates/:id
router.delete('/quotation-templates/:id', asyncHandler(async (req: Request, res: Response) => {
    await prisma.quotationTemplate.delete({ where: { id: parseInt(req.params.id) } });
    const templates = await prisma.quotationTemplate.findMany();
    res.json(templates);
}));

// POST /api/data/crm/leads/:leadId/quotations
router.post('/leads/:leadId/quotations', validate(createQuotationSchema), asyncHandler(async (req: Request, res: Response) => {
    const { leadId } = req.params;
    const { title, description, lineItems, total } = req.body;
    await prisma.quotation.create({
        data: {
            leadId: parseInt(leadId),
            title, description, lineItems, total,
            status: 'Draft',
            date: new Date().toLocaleDateString('en-CA')
        }
    });
    const allLeads = await prisma.crmLead.findMany({ include: { quotations: true }, orderBy: { createdAt: 'desc' }});
    res.json(allLeads);
}));

// PUT /api/data/crm/leads/:leadId/quotations/:id
router.put('/leads/:leadId/quotations/:id', validate(updateQuotationSchema), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, lineItems, total, status } = req.body;
    await prisma.quotation.update({
        where: { id: parseInt(id) },
        data: { title, description, lineItems, total, status }
    });
    const allLeads = await prisma.crmLead.findMany({ include: { quotations: true }, orderBy: { createdAt: 'desc' }});
    res.json(allLeads);
}));

export default router;
