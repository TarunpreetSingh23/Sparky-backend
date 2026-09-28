import { z } from 'zod';
import { errorResponse, ERROR_CODES } from './apiResponse';

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return { valid: false, errors };
  }
  return { valid: true, data: result.data };
}

export function validationErrorResponse(errors) {
  return errorResponse('Validation failed', ERROR_CODES.VALIDATION_ERROR, 400, { errors });
}

// Common validators
export const schemas = {
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
  objectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  timeSlot: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM'),
  paise: z.number().int().min(0, 'Amount must be non-negative integer in paise'),
};
