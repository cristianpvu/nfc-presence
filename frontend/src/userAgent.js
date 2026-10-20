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

export function describeUserAgent(userAgent = '') {
  const match = BROWSERS.map(([pattern, name]) => [userAgent.match(pattern), name]).find(([found]) => found);
  const browser = match ? `${match[1]} ${match[0][1]}` : null;
  return [browser, system(userAgent)].filter(Boolean).join(' · ') || '—';
}
