/**
 * Typed application errors with stable JSON shape.
 *
 * Throw AppError (or a helper) inside API routes; catch blocks convert via
 * toResponse() so every error response looks like:
 *   { error: 'message', code: 'INSUFFICIENT_BALANCE', details?: {...} }
 */

export class AppError extends Error {
    constructor(message, { code = 'INTERNAL_ERROR', status = 500, details = null } = {}) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.status = status;
        this.details = details;
    }

    toJSON() {
        const out = { error: this.message, code: this.code };
        if (this.details !== null && this.details !== undefined) out.details = this.details;
        return out;
    }
}

export function badRequest(message = 'Bad request', details = null) {
    return new AppError(message, { code: 'BAD_REQUEST', status: 400, details });
}

export function unauthorized(message = 'Unauthorized') {
    return new AppError(message, { code: 'UNAUTHORIZED', status: 401 });
}

export function forbidden(message = 'Forbidden') {
    return new AppError(message, { code: 'FORBIDDEN', status: 403 });
}

export function notFound(message = 'Not found') {
    return new AppError(message, { code: 'NOT_FOUND', status: 404 });
}

export function conflict(message = 'Conflict', details = null) {
    return new AppError(message, { code: 'CONFLICT', status: 409, details });
}

export function unprocessable(message = 'Validation failed', details = null) {
    return new AppError(message, { code: 'VALIDATION_ERROR', status: 422, details });
}

/** Wrap unknown throws so unexpected failures keep the same JSON shape. */
export function fromUnknown(err) {
    if (err instanceof AppError) return err;
    const message = err instanceof Error ? err.message : String(err);
    return new AppError(message || 'Internal server error', {
        code: 'INTERNAL_ERROR',
        status: 500,
    });
}

/** Format zod issues into a compact details object. */
export function zodDetails(zodError) {
    const issues = zodError?.issues ?? [];
    return issues.map((i) => ({
        path: Array.isArray(i.path) ? i.path.join('.') : String(i.path ?? ''),
        message: i.message,
        code: i.code,
    }));
}
