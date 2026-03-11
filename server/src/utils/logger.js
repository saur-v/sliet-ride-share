// server/src/utils/logger.js
import winston from 'winston';
import { config } from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) =>
    stack ? `${timestamp} ${level}: ${message}\n${stack}` : `${timestamp} ${level}: ${message}`
  )
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: config.isProd ? 'info' : 'debug',
  format: config.isProd ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    // In production you'd add a File or cloud transport here
  ],
});

export default logger;
