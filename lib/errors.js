export class AppError extends Error {
    constructor(message, statusCode = 400, code = 'APP_ERROR', details = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

export class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

export class InsufficientBalanceError extends AppError {
    constructor(message = 'Insufficient balance for this transaction') {
        super(message, 400, 'INSUFFICIENT_BALANCE');
        this.name = 'InsufficientBalanceError';
    }
}

export class DuplicateTransactionError extends AppError {
    constructor(message = 'Duplicate transaction request detected') {
        super(message, 409, 'DUPLICATE_TRANSACTION');
        this.name = 'DuplicateTransactionError';
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Requested resource not found') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}
