export function createLogger(prefix = '') {
  const formatArgs = (args) => args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      try { return JSON.stringify(arg); } catch (_) { return String(arg); }
    }
    return String(arg);
  }).join(' ');

  return {
    info: (...args) => {
      console.log(`${prefix} INFO: ${formatArgs(args)}`);
    },
    warn: (...args) => {
      console.warn(`${prefix} WARN: ${formatArgs(args)}`);
    },
    error: (...args) => {
      console.error(`${prefix} ERROR: ${formatArgs(args)}`);
    },
    debug: (...args) => {
      console.debug(`${prefix} DEBUG: ${formatArgs(args)}`);
    }
  };
}
