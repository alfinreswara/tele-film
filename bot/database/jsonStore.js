const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const dataDir = path.join(__dirname, '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function filePath(name) {
  ensureDataDir();
  return path.join(dataDir, `${name}.json`);
}

function readJson(name, fallback) {
  const target = filePath(name);

  if (!fs.existsSync(target)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (error) {
    logger.error('json_store_read_failed', { name, error: error.message });
    return fallback;
  }
}

function writeJson(name, data) {
  const target = filePath(name);
  const temp = `${target}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, target);
}

module.exports = {
  readJson,
  writeJson
};
