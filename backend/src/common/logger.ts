import winston from 'winston'
import rTracer from 'cls-rtracer'
import { config } from '../services/config.service'

const { combine, timestamp, printf, colorize } = winston.format

const logFormat = printf(
  ({ level, message, timestamp, requestId, ...metadata }) => {
    const metadataStr = Object.keys(metadata).length
      ? JSON.stringify(metadata)
      : ''
    return `${timestamp} [${level}] ${requestId || 'NO_REQ_ID'}: ${message} ${metadataStr}`
  },
)

let winstonLogger: winston.Logger | null = null

function getLogger(): winston.Logger {
  winstonLogger ??= winston.createLogger({
    level: config.logLevel,
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    transports: [
      new winston.transports.Console({
        format: combine(colorize(), logFormat),
      }),
    ],
  })

  return winstonLogger
}

const loggerWithContext = {
  info: (message: string, meta = {}) => {
    getLogger().info(message, { requestId: rTracer.id(), ...meta })
  },
  error: (message: string, meta = {}) => {
    getLogger().error(message, { requestId: rTracer.id(), ...meta })
  },
  warn: (message: string, meta = {}) => {
    getLogger().warn(message, { requestId: rTracer.id(), ...meta })
  },
}

export default loggerWithContext
