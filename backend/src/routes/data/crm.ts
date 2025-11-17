import express, { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { validate } from '../../middleware/validate';
import { createLeadSchema, updateLeadSchema, updateLeadStageSchema, createQuotationSchema, updateQuotationSchema } from '../../schemas/crmSchemas';

const router = express.Router();

// GET /api/data/crm/leads
router.get('/leads', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const leads = await prisma.crmLead.findMany({ include: { quotations: true }, orderBy: { createdAt: 'desc' } });
        res.json(leads);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/crm/leads
router.post('/leads', validate(createLeadSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, quotations, ...leadData } = req.body;
        const newLead = await prisma.crmLead.create({ data: { ...leadData, stage: 'New', createdAt: new Date() } });
        res.status(201).json(newLead);
    } catch (error) {
        next(error);
    }
});

// PUT /api/data/crm/leads/:id
router.put('/leads/:id', validate(updateLeadSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, quotations, ...leadData } = req.body;
        const updatedLead = await prisma.crmLead.update({ where: { id: parseInt(req.params.id) }, data: leadData });
        const leadWithRelations = await prisma.crmLead.findUnique({ where: { id: updatedLead.id }, include: { quotations: true }});
        res.json(leadWithRelations);
    } catch (error) {
        next(error);
    }
});

// PUT /api/data/crm/leads/:id/stage
router.put('/leads/:id/stage', validate(updateLeadStageSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { stage } = req.body;
        await prisma.crmLead.update({ where: { id: parseInt(req.params.id) }, data: { stage } });
        const allLeads = await prisma.crmLead.findMany({ include: { quotations: true }, orderBy: { createdAt: 'desc' }});
        res.json(allLeads);
    } catch (error) {
        next(error);
    }
});

// GET /api/data/crm/quotation-templates
router.get('/quotation-templates', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const templates = await prisma.quotationTemplate.findMany();
        res.json(templates);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/crm/quotation-templates
router.post('/quotation-templates', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, ...templateData } = req.body;
        // Add Zod validation here if needed
        await prisma.quotationTemplate.create({ data: templateData });
        const templates = await prisma.quotationTemplate.findMany();
        res.status(201).json(templates);
    } catch (error) {
        next(error);
    }
});

// PUT /api/data/crm/quotation-templates/:id
router.put('/quotation-templates/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, ...templateData } = req.body;
        await prisma.quotationTemplate.update({ where: { id: parseInt(req.params.id) }, data: templateData });
        const templates = await prisma.quotationTemplate.findMany();
        res.json(templates);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/data/crm/quotation-templates/:id
router.delete('/quotation-templates/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.quotationTemplate.delete({ where: { id: parseInt(req.params.id) } });
        const templates = await prisma.quotationTemplate.findMany();
        res.json(templates);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/crm/leads/:leadId/quotations
router.post('/leads/:leadId/quotations', validate(createQuotationSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
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
    } catch (error) {
        next(error);
    }
});

// PUT /api/data/crm/leads/:leadId/quotations/:id
router.put('/leads/:leadId/quotations/:id', validate(updateQuotationSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { title, description, lineItems, total, status } = req.body;
        await prisma.quotation.update({
            where: { id: parseInt(id) },
            data: { title, description, lineItems, total, status }
        });
        const allLeads = await prisma.crmLead.findMany({ include: { quotations: true }, orderBy: { createdAt: 'desc' }});
        res.json(allLeads);
    } catch (error) {
        next(error);
    }
});

export default router;