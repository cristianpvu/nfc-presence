export function initials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

let measureContext;

function measure(text, font) {
  measureContext ??= document.createElement('canvas').getContext('2d');
  measureContext.font = font;
  return measureContext.measureText(text).width;
}

function fit(text, maxWidth, font) {
  if (measure(text, font) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && measure(`${cut}…`, font) > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

export function nameLines(name, maxWidth, font) {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? [fit(first, maxWidth, font), fit(rest.join(' '), maxWidth, font)] : [fit(first, maxWidth, font)];
}
