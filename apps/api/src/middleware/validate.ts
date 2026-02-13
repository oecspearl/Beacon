import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.flatten();
      res.status(400).json({
        error: "Validation failed",
        details: errors.fieldErrors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.flatten();
      res.status(400).json({
        error: "Query validation failed",
        details: errors.fieldErrors,
      });
      return;
    }

    req.query = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.flatten();
      res.status(400).json({
        error: "Parameter validation failed",
        details: errors.fieldErrors,
      });
      return;
    }

    req.params = result.data;
    next();
  };
}
