import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    base: { env: process.env.NODE_ENV, service: 'sentinel-gateway' },
    // Transport is used for development pretty-printing
    transport: !isProduction 
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' }
        } 
      : undefined,
  },
  // In production, we pass a destination with sync: false (the new "extreme" mode)
  isProduction ? pino.destination({ sync: false }) : undefined
);
