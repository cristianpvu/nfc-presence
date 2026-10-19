const FONTS = [
  'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas', 'Courier New', 'Georgia',
  'Helvetica Neue', 'Impact', 'Lucida Console', 'Palatino', 'Segoe UI', 'Tahoma', 'Times New Roman',
  'Trebuchet MS', 'Verdana', 'Roboto', 'Noto Sans', 'Noto Serif', 'Droid Sans', 'Samsung Sans',
  'SamsungOne', 'OnePlus Sans', 'MiSans', 'HarmonyOS Sans', 'San Francisco', 'SF Pro Text',
  'Apple Color Emoji', 'Noto Color Emoji', 'Source Sans Pro', 'Ubuntu',
];

export async function sha(value) {
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest).slice(0, 6), byte => byte.toString(16).padStart(2, '0')).join('');
}

function webgl() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) return { image: null, renderer: null, params: null };

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, [
    'precision highp float;varying vec2 v;',
    'void main(){float a=sin(v.x*12.9898+v.y*78.233)*43758.5453;',
    'float b=cos(v.x*v.y*91.7+exp(v.y*2.3))*1000.123;',
    'gl_FragColor=vec4(fract(a),fract(b),fract(sqrt(abs(a*b))*0.001),1.);}',
  ].join('')));
  gl.linkProgram(program);
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  const pixels = new Uint8Array(256 * 256 * 4);
  gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debug ? `${gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)} / ${gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)}` : null;
  const params = [
    gl.MAX_TEXTURE_SIZE, gl.MAX_RENDERBUFFER_SIZE, gl.MAX_VERTEX_ATTRIBS, gl.MAX_VERTEX_UNIFORM_VECTORS,
    gl.MAX_FRAGMENT_UNIFORM_VECTORS, gl.MAX_VARYING_VECTORS, gl.MAX_TEXTURE_IMAGE_UNITS,
  ].map(name => gl.getParameter(name)).concat(Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)));

  return { image: Array.from(pixels.filter((_, index) => index % 7 === 0)).join(','), renderer, params: params.join(',') };
}

async function audio() {
  const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AudioContext) return null;
  const context = new AudioContext(1, 44100, 44100);
  const oscillator = context.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.value = 10000;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;
  oscillator.connect(compressor);
  compressor.connect(context.destination);
  oscillator.start(0);
  const buffer = await context.startRendering();
  const data = buffer.getChannelData(0);
  let sum = 0;
  for (let index = 4500; index < 5000; index++) sum += Math.abs(data[index]);
  return sum.toString();
}

function fonts() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const text = 'mmmmmmmmmmlliWWăîșț@#';
  const width = font => {
    context.font = `72px ${font}`;
    return context.measureText(text).width;
  };
  const base = ['monospace', 'serif', 'sans-serif'].map(width);
  return FONTS.filter(font => ['monospace', 'serif', 'sans-serif'].some((fallback, index) => width(`'${font}', ${fallback}`) !== base[index]));
}

function canvas2d() {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 60;
  const context = canvas.getContext('2d');
  context.textBaseline = 'top';
  context.font = '16px Arial';
  context.fillStyle = '#f60';
  context.fillRect(100, 1, 62, 20);
  context.fillStyle = '#069';
  context.fillText('Prezență NFC 😀 ăîșț', 2, 15);
  context.fillStyle = 'rgba(102, 204, 0, 0.7)';
  context.fillText('Prezență NFC 😀 ăîșț', 4, 17);
  return canvas.toDataURL();
}

async function uaDetails() {
  if (!navigator.userAgentData?.getHighEntropyValues) return null;
  try {
    const values = await navigator.userAgentData.getHighEntropyValues(['model', 'platformVersion', 'architecture']);
    return { model: values.model, platform: values.platform, platformVersion: values.platformVersion, architecture: values.architecture };
  } catch {
    return null;
  }
}

export async function collectSignals() {
  const gl = webgl();
  const [audioValue, ua] = await Promise.all([audio().catch(() => null), uaDetails()]);
  const fontList = fonts();

  const stable = {
    cores: navigator.hardwareConcurrency ?? null,
    memory: navigator.deviceMemory ?? null,
    screen: `${screen.width}x${screen.height}@${window.devicePixelRatio}`,
    colorDepth: screen.colorDepth,
    touchPoints: navigator.maxTouchPoints ?? 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    webglImage: gl.image ? await sha(gl.image) : null,
    webglParams: gl.params,
    audio: audioValue,
    fonts: fontList.join(', '),
  };

  const perBrowser = {
    userAgent: navigator.userAgent,
    renderer: gl.renderer,
    canvas2d: await sha(canvas2d()),
    languages: navigator.languages?.join(', '),
    model: ua?.model || null,
  };

  return {
    stable,
    perBrowser,
    hashes: {
      crossBrowser: await sha([stable.cores, stable.memory, stable.screen, stable.touchPoints, stable.timezone, stable.webglImage, stable.fonts]),
      hardwareOnly: await sha([stable.cores, stable.screen, stable.touchPoints, stable.webglImage]),
      perBrowser: await sha({ ...stable, ...perBrowser }),
    },
  };
}
