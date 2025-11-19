import pino from 'pino';

let logger: pino.Logger | null = null;

const isBrowser = typeof window !== 'undefined';

const usePrettyTransport = process.env.APP_NAME === 'mooc-manus-api';

const getTransport = () => {
  if (isBrowser || !usePrettyTransport) {
    return undefined;
  }

  return pino.transport({
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'req,res',
      messageFormat: '{if req.id}{req.id} - {end}{msg}',
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
      singleLine: false,
    },
  });
};

export const createLogger = (logLevel: string) => {
  if (logger) {
    return logger;
  }

  const transport = getTransport();

  if (transport) {
    if (typeof transport === 'object' && 'on' in transport) {
      transport.on('error', (error: Error) => {
        console.error(error);
      });
    }
  }

  logger = pino(
    {
      level: logLevel,
    },
    transport,
  );

  return logger;
};

export const getLogger = () => {
  if (!logger) {
    return createLogger('info');
  }
  return logger;
};
