import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils";

type ValidationRule = {
  field: string;
  value: unknown;
  rules: Array<{
    check: (val: unknown) => boolean;
    message: string;
  }>;
};

export function validateBody(
  buildRules: (body: Record<string, unknown>) => ValidationRule[]
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const rules = buildRules(req.body);
    const errors: Array<{ field: string; message: string }> = [];

    for (const rule of rules) {
      for (const check of rule.rules) {
        if (!check.check(rule.value)) {
          errors.push({ field: rule.field, message: check.message });
          break;
        }
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError(errors));
    }
    next();
  };
}

// Common validation helpers
export const isRequired = (val: unknown): boolean =>
  val !== undefined && val !== null && (typeof val !== "string" ? true : val.trim() !== "");

export const isString = (val: unknown): boolean => typeof val === "string";

export const minLength = (min: number) => (val: unknown): boolean =>
  typeof val === "string" && val.trim().length >= min;

export const maxLength = (max: number) => (val: unknown): boolean =>
  typeof val === "string" && val.trim().length <= max;

export const isEmail = (val: unknown): boolean =>
  typeof val === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

export const isValidPassword = (val: unknown): boolean =>
  typeof val === "string" &&
  val.length >= 8 &&
  /[a-z]/.test(val) &&
  /[A-Z]/.test(val) &&
  /[0-9]/.test(val);

export const isOneOf = (values: string[]) => (val: unknown): boolean =>
  typeof val === "string" && values.includes(val);

export const isValidDate = (val: unknown): boolean =>
  typeof val === "string" && !isNaN(Date.parse(val));

export const isOptional = (checkFn: (val: unknown) => boolean) => (val: unknown): boolean =>
  val === undefined || val === null || val === "" || checkFn(val);
