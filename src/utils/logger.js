'use strict';

/**
 * Logger wrapper — usa strapi.log internamente.
 * En tests usa console directamente.
 * Niveles: debug, info, warn, error
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

function shouldLog(level) {
  return LEVELS[level] >= LEVELS[LOG_LEVEL];
}

const logger = {
  debug: (msg, meta = {}) => {
    if (shouldLog('debug') && typeof strapi !== 'undefined') {
      strapi.log.debug(msg, meta);
    }
  },
  info: (msg, meta = {}) => {
    if (shouldLog('info')) {
      if (typeof strapi !== 'undefined') strapi.log.info(msg, meta);
    }
  },
  warn: (msg, meta = {}) => {
    if (shouldLog('warn')) {
      if (typeof strapi !== 'undefined') strapi.log.warn(msg, meta);
      else console.warn(`[WARN] ${msg}`, meta);
    }
  },
  error: (msg, meta = {}) => {
    if (typeof strapi !== 'undefined') strapi.log.error(msg, meta);
    else console.error(`[ERROR] ${msg}`, meta);
  },
};

module.exports = logger;
