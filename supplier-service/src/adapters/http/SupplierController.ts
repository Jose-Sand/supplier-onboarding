import { Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { RegisterSupplier } from '../../application/use-cases/RegisterSupplier';
import { ApproveSupplier } from '../../application/use-cases/ApproveSupplier';
import { RejectSupplier } from '../../application/use-cases/RejectSupplier';
import { GetSupplier } from '../../application/use-cases/GetSupplier';
import { ListSuppliers } from '../../application/use-cases/ListSuppliers';
import {
  registerSupplierSchema,
  supplierIdSchema,
  rejectSupplierSchema,
} from './schemas/supplier.schema';

function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

function handleError(res: Response, error: unknown): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }
  const message = error instanceof Error ? error.message : 'Internal server error';
  const status = message.includes('not found') ? 404
    : message.includes('already exists') ? 409
    : 400;
  res.status(status).json({ error: message });
}

export class SupplierController {
  constructor(
    private readonly registerUseCase: RegisterSupplier,
    private readonly approveUseCase: ApproveSupplier,
    private readonly rejectUseCase: RejectSupplier,
    private readonly getUseCase: GetSupplier,
    private readonly listUseCase: ListSuppliers,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = validate(registerSupplierSchema, req.body);
      const result = await this.registerUseCase.execute(body);
      res.status(201).json(result);
    } catch (error) {
      handleError(res, error);
    }
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = validate(supplierIdSchema, req.params);
      const result = await this.approveUseCase.execute({ supplierId: id });
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = validate(supplierIdSchema, req.params);
      const body = validate(rejectSupplierSchema, req.body);
      const result = await this.rejectUseCase.execute({ supplierId: id, reason: body.reason });
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = validate(supplierIdSchema, req.params);
      const result = await this.getUseCase.execute({ supplierId: id });
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.listUseCase.execute();
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  };
}
