import winston from 'winston';
import rTracer from 'cls-rtracer';
import * as dotenv from 'dotenv';
dotenv.config();

const { combine, timestamp, printf, colorize } = winston.format;

const LOG_LEVEL = process.env.LOG_LEVEL?.toLowerCase() || 'info';

const validLogLevels = ['error', 'warn', 'info'];
if (!validLogLevels.includes(LOG_LEVEL)) {
  console.warn(`Invalid LOG_LEVEL "${LOG_LEVEL}". Defaulting to "info"`);
}

const logFormat = printf(({ level, message, timestamp, requestId, ...metadata }) => {
  const metadataStr = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
  return `${timestamp} [${level}] ${requestId || 'NO_REQ_ID'}: ${message} ${metadataStr}`;
});

const winstonLogger = winston.createLogger({
  level: validLogLevels.includes(LOG_LEVEL) ? LOG_LEVEL : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    })
  ]
});

const loggerWithContext = {
  info: (message: string, meta = {}) => {
    winstonLogger.info(message, { requestId: rTracer.id(), ...meta });
  },
  error: (message: string, meta = {}) => {
    winstonLogger.error(message, { requestId: rTracer.id(), ...meta });
  },
  warn: (message: string, meta = {}) => {
    winstonLogger.warn(message, { requestId: rTracer.id(), ...meta });
  },
  isLevelEnabled: (level: string) => {
    const levels = winston.config.npm.levels;
    return levels[winstonLogger.level] >= levels[level];
  }
};

// Only log initialization if we're at info level or below
if (loggerWithContext.isLevelEnabled('info')) {
  loggerWithContext.info(`Logger initialized with level: ${LOG_LEVEL}`);
}

export default loggerWithContext;
