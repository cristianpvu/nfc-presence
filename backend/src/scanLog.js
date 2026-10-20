const ScanLog = require('./models/ScanLog');

const clientIp = req => req.headers['cf-connecting-ip'] || req.ip;

function logScan(req, event, details = {}) {
  ScanLog.create({
    event,
    browserId: typeof req.body?.deviceId === 'string' ? req.body.deviceId.slice(0, 64) : undefined,
    ip: clientIp(req),
    userAgent: String(req.headers['user-agent'] ?? '').slice(0, 250),
    ...details,
  }).catch(err => console.error('Scan log failed:', err.message));
}

module.exports = logScan;
