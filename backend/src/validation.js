const isValidDeviceId = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);

const normalizeName = value => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '');

const MIN_PASSWORD_LENGTH = 6;

const isValidPassword = value => typeof value === 'string' && value.length >= MIN_PASSWORD_LENGTH && value.length <= 200;

module.exports = { isValidDeviceId, normalizeName, isValidPassword };
