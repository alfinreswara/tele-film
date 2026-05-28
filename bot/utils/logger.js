const levels = ['debug', 'info', 'warn', 'error'];
const currentLevel = process.env.LOG_LEVEL || 'info';

function shouldLog(level) {
  return levels.indexOf(level) >= levels.indexOf(currentLevel);
}

function log(level, message, meta = {}) {
  if (!shouldLog(level)) return;

  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...meta
  };

  const writer = level === 'error' ? console.error : console.log;
  writer(JSON.stringify(payload));
}

module.exports = {
  debug: (message, meta) => log('debug', message, meta),
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta)
};
