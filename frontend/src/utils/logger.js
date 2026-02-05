const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args) => {
    if (isDevelopment) console.log(...args);
  },
  info: (...args) => {
    if (isDevelopment) console.info(...args);
  },
  warn: (...args) => {
    if (isDevelopment) console.warn(...args);
  },
  error: (...args) => {
    // Always log errors, even in production (for debugging)
    console.error(...args);
  },
  debug: (...args) => {
    if (isDevelopment) console.debug(...args);
  }
};

export default logger;