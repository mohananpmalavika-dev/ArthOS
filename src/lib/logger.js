/**
 * Simple logging utility for ARTH.OS
 * Logs to console in development only
 * Allows errors in production for debugging
 */

const isDev = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  // Debug logs - development only
  debug: (label, data) => {
    if (isDev) {
      console.log(`[DEBUG] ${label}`, data);
    }
  },

  // Info logs - development only
  info: (label, data) => {
    if (isDev) {
      console.log(`[INFO] ${label}`, data);
    }
  },

  // Warning logs - development only
  warn: (label, data) => {
    if (isDev) {
      console.warn(`[WARN] ${label}`, data);
    }
  },

  // Error logs - always logged (safe for production)
  error: (label, error) => {
    if (error instanceof Error) {
      console.error(`[ERROR] ${label}:`, error.message);
      if (isDev) {
        console.error(error.stack);
      }
    } else {
      console.error(`[ERROR] ${label}:`, error);
    }
  },

  // Performance timing
  time: (label) => {
    if (isDev) {
      console.time(label);
    }
  },

  timeEnd: (label) => {
    if (isDev) {
      console.timeEnd(label);
    }
  },

  // Group logs
  group: (label) => {
    if (isDev) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  }
};

export default logger;
