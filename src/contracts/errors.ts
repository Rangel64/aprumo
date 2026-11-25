import { z } from "zod";

/**
 * Códigos de erro v1 (plano §3). Só por adição: nunca renomear nem remover.
 */
export const ERROR_CODES = [
  "UNAUTHENTICATED",
  "VALIDATION",
  "NOT_FOUND",
  "CONFLICT",
  "NO_ACTIVE_JOURNEY",
  "TEXT_TOO_SHORT",
  "TEXT_TOO_LONG",
  "QUOTA_USER_EXCEEDED",
  "QUOTA_GLOBAL_EXCEEDED",
  "AI_DISABLED",
  "AI_TIMEOUT",
  "AI_UNAVAILABLE",
  "AI_INVALID_OUTPUT",
  "INTERNAL",
] as const;

export const ErrorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

/** `message` é pt-BR, pronta para a UI. Nunca carrega stack nem mensagem do provedor. */
export const AppErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string().min(1),
  field: z.string().optional(),
});
export type AppError = z.infer<typeof AppErrorSchema>;

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

/** Corpo de erro do Route Handler: `{ error: AppError }`. */
export const ErrorBodySchema = z.object({ error: AppErrorSchema });
export type ErrorBody = z.infer<typeof ErrorBodySchema>;

/**
 * Status HTTP por código no Route Handler (plano §3: 400, 401, 404, 429, 503, 504, 500).
 * Decisão desta T2 (D-045): AI_INVALID_OUTPUT = 502 (o provedor respondeu, mas com
 * saída que não passou no schema). A UI trata pelo `code`, não pelo status.
 * NO_ACTIVE_JOURNEY e CONFLICT só aparecem em actions, mas têm status para completude.
 */
export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  VALIDATION: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  NO_ACTIVE_JOURNEY: 409,
  TEXT_TOO_SHORT: 400,
  TEXT_TOO_LONG: 400,
  QUOTA_USER_EXCEEDED: 429,
  QUOTA_GLOBAL_EXCEEDED: 429,
  AI_DISABLED: 503,
  AI_TIMEOUT: 504,
  AI_UNAVAILABLE: 503,
  AI_INVALID_OUTPUT: 502,
  INTERNAL: 500,
};

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(
  code: ErrorCode,
  message: string,
  field?: string,
): ActionResult<T> {
  return {
    ok: false,
    error: field === undefined ? { code, message } : { code, message, field },
  };
}
