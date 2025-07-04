const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

const LOG_FILE = path.join(LOG_DIR, 'uploads_audit.log');

function logAudit(action, filePath, userId = null, extra = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action, // 'upload' ou 'delete'
    filePath,
    userId,
    ...extra
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
}

module.exports = { logAudit }; 