
import { z } from 'zod';

const crmStageSchema = z.enum(['New', 'Qualified', 'Proposal', 'Won', 'Lost']);
const quotationStatusSchema = z.enum(['Draft', 'Sent', 'Accepted', 'Rejected']);

const quotationLineItemSchema = z.object({
  description: z.string().min(1),
  price: z.number().positive(),
});

export const createLeadSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    company: z.string().min(1, 'Company is required'),
    value: z.number().nonnegative('Value must be a non-negative number'),
    contact: z.string().min(1, 'Contact person is required'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    source: z.string().optional(),
    assignedTo: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateLeadSchema = z.object({
    body: createLeadSchema.shape.body.partial(),
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number"),
    }),
});


export const updateLeadStageSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  body: z.object({
    stage: crmStageSchema,
  }),
});

export const createQuotationSchema = z.object({
    params: z.object({
        leadId: z.string().regex(/^\d+$/, "Lead ID must be a number"),
    }),
    body: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        lineItems: z.array(quotationLineItemSchema).min(1),
        total: z.number().positive(),
    }),
});

export const updateQuotationSchema = createQuotationSchema.extend({
    params: z.object({
        leadId: z.string().regex(/^\d+$/, "Lead ID must be a number"),
        id: z.string().regex(/^\d+$/, "Quotation ID must be a number"),
    }),
    body: createQuotationSchema.shape.body.extend({
        status: quotationStatusSchema,
    })
});
