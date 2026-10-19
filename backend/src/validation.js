const isValidDeviceId = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);

const normalizeName = value => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '');

module.exports = { isValidDeviceId, normalizeName };
