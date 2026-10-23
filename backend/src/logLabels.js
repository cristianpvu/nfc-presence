const EVENT_LABELS = {
  scan_ok: 'Scanare validă',
  attendance_ok: 'Prezență înregistrată',
  link_missing: 'Link fără date',
  link_invalid: 'Link invalid sau copiat',
  tag_unknown: 'Etichetă neasociată',
  no_course: 'Niciun curs în sală',
  browser_used: 'Browser deja folosit',
  seat_taken: 'Bancă deja ocupată',
  token_invalid: 'Sesiune expirată sau transferată',
  course_ended: 'Curs încheiat',
  verify_down: 'Serviciu NFC indisponibil',
};

const BROWSERS = [
  [/SamsungBrowser\/(\d+)/, 'Samsung Internet'],
  [/EdgA?\/(\d+)/, 'Edge'],
  [/OPR\/(\d+)/, 'Opera'],
  [/CriOS\/(\d+)/, 'Chrome'],
  [/FxiOS\/(\d+)/, 'Firefox'],
  [/Firefox\/(\d+)/, 'Firefox'],
  [/Chrome\/(\d+)/, 'Chrome'],
  [/Version\/(\d+)[\d.]* .*Safari/, 'Safari'],
];

function system(userAgent) {
  const android = userAgent.match(/Android (\d+)/);
  if (android) return `Android ${android[1]}`;
  const ios = userAgent.match(/(?:iPhone|CPU) OS (\d+)_?(\d+)?/);
  if (ios) return `iOS ${ios[1]}${ios[2] ? `.${ios[2]}` : ''}`;
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Mac OS X/.test(userAgent)) return 'macOS';
  if (/Linux/.test(userAgent)) return 'Linux';
  return null;
}

function describeUserAgent(userAgent) {
  if (!userAgent) return '—';
  const match = BROWSERS.map(([pattern, name]) => [userAgent.match(pattern), name]).find(([found]) => found);
  const browser = match ? `${match[1]} ${match[0][1]}` : null;
  return [browser, system(userAgent)].filter(Boolean).join(', ') || '—';
}

module.exports = { EVENT_LABELS, describeUserAgent };
