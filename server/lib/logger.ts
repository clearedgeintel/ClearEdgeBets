const isDev = process.env.NODE_ENV !== 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const entry = {
    time: new Date().toISOString(),
    level,
    msg: message,
    ...data,
  };

  if (isDev) {
    const prefix = { info: 'ℹ', warn: '⚠', error: '✖', debug: '·' }[level];
    const extra = data ? ' ' + JSON.stringify(data) : '';
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `${prefix} [${entry.time}] ${message}${extra}`
    );
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info:  (msg: string, data?: Record<string, unknown>) => log('info',  msg, data),
  warn:  (msg: string, data?: Record<string, unknown>) => log('warn',  msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log('error', msg, data),
  debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, data),
};
