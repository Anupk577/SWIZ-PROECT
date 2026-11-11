/**
 * Structured JSON Logger for Swiz Protocol Backend (APP-H-05)
 * Produces structured, machine-readable JSON logs compatible with
 * CloudWatch, Datadog, Elasticsearch, and SIEM ingestors.
 */

const LOG_LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

const currentLevel = process.env.LOG_LEVEL ? (LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO) : LOG_LEVELS.INFO;

function formatLog(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "swiz-backend",
    environment: process.env.NODE_ENV || "production",
    message,
    ...meta,
  };
  return JSON.stringify(entry);
}

export const logger = {
  debug(message, meta) {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log(formatLog("DEBUG", message, meta));
    }
  },
  info(message, meta) {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.log(formatLog("INFO", message, meta));
    }
  },
  warn(message, meta) {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(formatLog("WARN", message, meta));
    }
  },
  error(message, meta) {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(formatLog("ERROR", message, meta));
    }
  },
};
