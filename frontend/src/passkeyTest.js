import { sha } from './deviceSignals';

const random = length => crypto.getRandomValues(new Uint8Array(length));

export async function passkeyCapabilities() {
  if (!window.PublicKeyCredential) return { supported: false };
  const capabilities = PublicKeyCredential.getClientCapabilities
    ? await PublicKeyCredential.getClientCapabilities().catch(() => ({}))
    : {};
  const platform = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.().catch(() => false);
  return { supported: true, immediateGet: Boolean(capabilities.immediateGet), platform: Boolean(platform), capabilities };
}

async function describe(credential) {
  return {
    credentialId: await sha(credential.id),
    user: credential.response.userHandle ? await sha(Array.from(new Uint8Array(credential.response.userHandle)).join(',')) : null,
  };
}

export async function createPasskey() {
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: random(32),
      rp: { name: 'Prezență NFC (test)', id: location.hostname },
      user: { id: random(16), name: 'test-dispozitiv', displayName: 'Test dispozitiv' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
      timeout: 60000,
    },
  });
  return describe(credential);
}

export async function getPasskey(immediate) {
  const started = performance.now();
  try {
    const credential = await navigator.credentials.get({
      publicKey: { challenge: random(32), rpId: location.hostname, userVerification: 'preferred', allowCredentials: [], timeout: 60000 },
      ...(immediate ? { uiMode: 'immediate' } : {}),
    });
    return { outcome: 'found', ms: Math.round(performance.now() - started), ...(await describe(credential)) };
  } catch (err) {
    return { outcome: err.name, ms: Math.round(performance.now() - started) };
  }
}
