const isProduction = process.env.NODE_ENV === 'production';

function formatLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
    });
}

export const logger = {
    info(message, meta = {}) {
        console.log(formatLog('info', message, meta));
    },
    warn(message, meta = {}) {
        console.warn(formatLog('warn', message, meta));
    },
    error(message, error = null, meta = {}) {
        const errorMeta = error ? {
            errorMessage: error.message || String(error),
            errorStack: isProduction ? undefined : error.stack,
            errorCode: error.code,
        } : {};
        console.error(formatLog('error', message, { ...errorMeta, ...meta }));
    },
    debug(message, meta = {}) {
        if (!isProduction) {
            console.debug(formatLog('debug', message, meta));
        }
    }
};

export default logger;
