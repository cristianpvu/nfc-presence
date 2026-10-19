const { VERIFY_UNAVAILABLE } = require('./messages');

const isFilled = value => typeof value === 'string' && value.length > 0 && value.length < 200;

async function verifyTag({ picc, uid, ctr, cmac }) {
  const params = isFilled(picc) ? { picc, cmac } : { uid, ctr, cmac };
  if (!Object.values(params).every(isFilled)) return null;

  let data;
  try {
    const res = await fetch(`${process.env.NFC_VERIFY_URL}?${new URLSearchParams(params)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.status >= 500) throw new Error(`Verify service responded ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error('NFC verify failed:', err.message);
    throw Object.assign(new Error(VERIFY_UNAVAILABLE), { status: 502, expose: true });
  }

  return data?.valid === true && typeof data.uid === 'string' ? data.uid.toUpperCase() : null;
}

module.exports = verifyTag;
