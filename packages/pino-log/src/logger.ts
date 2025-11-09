import pino from 'pino';

let logger: pino.Logger | null = null;

const prettyTransport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    ignore: 'req,res',
    messageFormat: '{if req.id}{req.id} - {end}{msg}',
    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
  },
});

export const createLogger = (logLevel: string) => {
  if (logger) {
    return logger;
  }
  logger = pino(
    {
      level: logLevel,
    },
    prettyTransport,
  );

  return logger;
};

export const getLogger = () => {
  if (!logger) {
    throw new Error('Logger not initialized');
  }
  return logger;
};
