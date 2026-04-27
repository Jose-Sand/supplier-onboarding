import { z } from 'zod';

export const registerSupplierSchema = z.object({
  companyName: z.string().min(1, 'companyName cannot be empty'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number too short'),
  country: z.string().min(2, 'country must be at least 2 characters'),
});

export const supplierIdSchema = z.object({
  id: z.string().uuid('Invalid supplier id'),
});

export const rejectSupplierSchema = z.object({
  reason: z.string().optional(),
});
