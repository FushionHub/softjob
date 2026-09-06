/**
 * Structured JSON logger (zero dependencies).
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('deposit created', { userId, amount });
 *   const log = logger.child({ route: '/api/withdraw' });
 *   log.error('insert failed', { code: err.code });
 *
 * Output: one JSON object per line (stdout for debug/info/warn, stderr for
 * error). In tests, redirect with setLogSink(entry => captured.push(entry)).
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

let sink = null;

export function setLogSink(fn) {
    sink = fn || null;
}

export function getLogSink() {
    return sink;
}

function emit(level, msg, context) {
    const entry = {
        ts: new Date().toISOString(),
        level,
        msg: String(msg),
        ...(context && typeof context === 'object' ? context : {}),
    };
    if (sink) {
        try {
            sink(entry);
        } catch {
            // sink failures must never break the app
        }
        return entry;
    }
    const line = JSON.stringify(entry);
    if (level === 'error') {
        console.error(line);
    } else {
        console.log(line);
    }
    return entry;
}

function normalizeArgs(msgOrMeta, meta) {
    if (typeof msgOrMeta === 'string') return [msgOrMeta, meta];
    if (msgOrMeta instanceof Error) {
        return [msgOrMeta.message, { ...(meta || {}), stack: msgOrMeta.stack, name: msgOrMeta.name }];
    }
    return ['event', { ...(msgOrMeta || {}), ...(meta || {}) }];
}

export function createLogger(baseContext = {}) {
    const withCtx = (extra) => createLogger({ ...baseContext, ...(extra || {}) });
    const api = {};
    for (const level of Object.keys(LEVELS)) {
        api[level] = (msgOrMeta, meta) => {
            const [msg, ctx] = normalizeArgs(msgOrMeta, meta);
            return emit(level, msg, { ...baseContext, ...ctx });
        };
    }
    api.child = withCtx;
    api.level = 'debug';
    return api;
}

export const logger = createLogger({ service: 'emporium-capitals' });

export default logger;
