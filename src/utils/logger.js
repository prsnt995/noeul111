// Lightweight client logger. In production, only warnings/errors are emitted;
// verbose info/debug calls are dropped. Swap the transport here if a real
// monitoring backend (Sentry, etc.) is added later.
const isProd = import.meta.env?.PROD === true;

export const logger = {
  debug: (...args) => { if (!isProd) console.debug(...args); },
  info: (...args) => { if (!isProd) console.info(...args); },
  warn: (...args) => { console.warn(...args); },
  error: (...args) => { console.error(...args); },
};
