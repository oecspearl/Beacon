import type { Request } from "express";

/**
 * Safely extract a route parameter as a string.
 * Express 5 types `req.params` values as `string | string[] | undefined`,
 * but named route params (e.g. `/:id`) are always plain strings at runtime.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
