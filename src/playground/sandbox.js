// Builds the srcdoc of a sandboxed iframe that runs one code example.
// The iframe has no same-origin access; it reports output to the parent with postMessage.

const REACT = 'https://esm.sh/react@19.1.0';
const REACT_DOM = 'https://esm.sh/react-dom@19.1.0';
const RN_WEB = 'https://esm.sh/react-native-web@0.21.1?deps=react@19.1.0,react-dom@19.1.0';
const BABEL = 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.28.4/babel.min.js';
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
const PHP_WASM = 'https://cdn.jsdelivr.net/npm/php-wasm@0.2.0/PhpWeb.mjs';

export const RUNNABLE_LANGS = ['js', 'ts', 'react', 'rn', 'python', 'php'];
export const UI_LANGS = ['react', 'rn'];

// JSON-encode a value so it is safe to inline inside a <script> tag.
const BS = String.fromCharCode(92); // backslash
const json = (v) =>
  JSON.stringify(v).replace(/[<\u2028\u2029]/g, (c) => BS + 'u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

// Runs first inside the iframe: console capture, error reporting, value formatting.
const bootstrap = (runId) => `
(() => {
  const RUN = ${json(runId)};
  const post = (type, text) => parent.postMessage({ __pg: RUN, type, text }, '*');
  const fmt = (v, depth = 0, seen = new WeakSet()) => {
    if (typeof v === 'string') return depth ? JSON.stringify(v) : v;
    if (typeof v === 'function') return v.toString().startsWith('class') ? '[class ' + (v.name || 'anonymous') + ']' : '[Function: ' + (v.name || 'anonymous') + ']';
    if (typeof v === 'bigint') return v + 'n';
    if (typeof v === 'symbol') return v.toString();
    if (v === null || typeof v !== 'object') return String(v);
    if (v instanceof Error) return depth ? '[' + v.name + ': ' + v.message + ']' : v.name + ': ' + v.message;
    if (seen.has(v)) return '[Circular]';
    if (depth > 4) return Array.isArray(v) ? '[Array]' : '[Object]';
    seen.add(v);
    const inner = (x) => fmt(x, depth + 1, seen);
    let out;
    if (Array.isArray(v)) out = '[ ' + v.map(inner).join(', ') + ' ]';
    else if (v instanceof Map) out = 'Map(' + v.size + ') { ' + [...v].map(([k, x]) => inner(k) + ' => ' + inner(x)).join(', ') + ' }';
    else if (v instanceof Set) out = 'Set(' + v.size + ') { ' + [...v].map(inner).join(', ') + ' }';
    else if (v instanceof Date) out = v.toISOString();
    else if (v instanceof RegExp) out = String(v);
    else if (v instanceof Promise) out = 'Promise { <pending> }';
    else {
      const name = v.constructor && v.constructor !== Object ? v.constructor.name + ' ' : '';
      const keys = Object.keys(v);
      out = name + (keys.length ? '{ ' + keys.map((k) => (/^[A-Za-z_$][\\w$]*$/.test(k) ? k : JSON.stringify(k)) + ': ' + inner(v[k])).join(', ') + ' }' : '{}');
    }
    seen.delete(v);
    return out;
  };
  const fmtArgs = (args) => {
    if (typeof args[0] === 'string' && /%[sdioOfc]/.test(args[0])) {
      let i = 1;
      const head = args[0].replace(/%([sdioOfc])/g, (m, f) => {
        if (i >= args.length) return m;
        const a = args[i++];
        if (f === 'c') return '';
        if (f === 'd' || f === 'i') return String(parseInt(a));
        if (f === 'f') return String(parseFloat(a));
        return typeof a === 'string' ? a : fmt(a);
      });
      return [head, ...args.slice(i).map((a) => fmt(a))].join(' ');
    }
    return args.map((a) => fmt(a)).join(' ');
  };
  for (const level of ['log', 'info', 'debug', 'warn', 'error', 'table', 'dir']) {
    const orig = console[level];
    console[level] = (...args) => {
      post(level === 'warn' || level === 'error' ? level : 'log', fmtArgs(args));
      try { orig.apply(console, args); } catch {}
    };
  }
  window.__pgPost = post;
  window.__pgFmt = fmt;
  window.addEventListener('error', (e) => {
    const err = e.error;
    post('error', err ? (err.name || 'Error') + ': ' + err.message : String(e.message || e));
  });
  window.addEventListener('unhandledrejection', (e) => {
    post('error', 'Uncaught (in promise) ' + fmt(e.reason));
  });
  const ro = new ResizeObserver(() => post('height', String(document.documentElement.scrollHeight)));
  addEventListener('DOMContentLoaded', () => ro.observe(document.body));
})();`;

// Runs plain JS as a classic script (sloppy mode, like a browser console);
// falls back to a module only when the code needs top-level await.
const runJs = `
window.__pgRunJs = (src) => {
  let type = 'classic';
  try { new Function(src); } catch (e) {
    try { new (Object.getPrototypeOf(async function () {}).constructor)(src); type = 'module'; } catch {}
  }
  const s = document.createElement('script');
  if (type === 'module') s.type = 'module';
  s.textContent = src;
  document.body.appendChild(s);
  setTimeout(() => window.__pgPost('ready', ''), 0);
};`;

const loadScript = (src) =>
  `await new Promise((res, rej) => { const s = document.createElement('script'); s.src = ${json(src)}; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + ${json(src)} + '. Check your internet connection.')); document.head.appendChild(s); });`;

function page({ runId, head = '', body = '', script, styles = '' }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0}body{font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:12px;color:#18181b;background:#fff}${styles}</style>
<script>${bootstrap(runId)}</script>${head}</head><body>${body}<script type="module">
try {
${script}
} catch (e) { if (e !== 0) window.__pgPost('error', (e && e.name ? e.name + ': ' : '') + (e && e.message ? e.message : String(e))); window.__pgPost('ready', ''); }
</script></body></html>`;
}

export function buildSrcdoc(lang, code, runId) {
  const CODE = json(code);

  if (lang === 'js') {
    return page({
      runId,
      head: `<script>${runJs}</script>`,
      script: `window.__pgPost('loading', ''); window.__pgRunJs(${CODE});`,
    });
  }

  if (lang === 'ts') {
    return page({
      runId,
      head: `<script>${runJs}</script>`,
      script: `window.__pgPost('loading', 'ts');
${loadScript(BABEL)}
let out;
try {
  out = Babel.transform(${CODE}, { filename: 'example.ts', presets: [['typescript', { allExtensions: true, onlyRemoveTypeImports: true }]], parserOpts: { allowAwaitOutsideFunction: true }, sourceType: 'module', comments: true }).code;
} catch (e) { window.__pgPost('error', 'SyntaxError: ' + e.message.replace(/^example\\.ts: /, '')); window.__pgPost('ready', ''); throw 0; }
window.__pgRunJs(out);`,
    });
  }

  if (lang === 'react' || lang === 'rn') {
    const imports = { react: REACT, 'react/': REACT + '/', 'react-dom': REACT_DOM, 'react-dom/': REACT_DOM + '/' };
    if (lang === 'rn') imports['react-native'] = RN_WEB;
    // Rewrite to the full URLs so esm.sh dedupes React.
    imports['react-dom/client'] = REACT_DOM + '/client?deps=react@19.1.0';
    imports['react/jsx-runtime'] = REACT + '/jsx-runtime';
    return page({
      runId,
      head: `<script type="importmap">${json({ imports })}</script>`,
      body: '<div id="root"></div>',
      styles: lang === 'rn' ? '#root{display:flex;flex-direction:column;min-height:120px}' : '',
      script: `window.__pgPost('loading', '${lang}');
${loadScript(BABEL)}
let out;
try {
  out = Babel.transform(${CODE} + "\\n;import { createRoot as __pgCreateRoot } from 'react-dom/client';\\n__pgCreateRoot(document.getElementById('root'), { onUncaughtError: (e) => window.__pgPost('error', (e.name || 'Error') + ': ' + e.message), onCaughtError: (e) => console.error(e) }).render(<App />);",
    { filename: 'App.tsx', presets: [['react', { runtime: 'automatic' }], ['typescript', { allExtensions: true, isTSX: true }]], sourceType: 'module' }).code;
} catch (e) { window.__pgPost('error', 'SyntaxError: ' + e.message.replace(/^App\\.tsx: /, '')); window.__pgPost('ready', ''); throw 0; }
const s = document.createElement('script');
s.type = 'module';
s.textContent = out;
document.body.appendChild(s);
s.addEventListener('load', () => {});
setTimeout(() => window.__pgPost('ready', ''), 50);`,
    });
  }

  if (lang === 'python') {
    return page({
      runId,
      script: `window.__pgPost('loading', 'python');
${loadScript(PYODIDE + 'pyodide.js')}
const py = await loadPyodide({ indexURL: ${json(PYODIDE)} });
py.setStdout({ batched: (s) => window.__pgPost('log', s) });
py.setStderr({ batched: (s) => window.__pgPost('warn', s) });
// Some stdlib modules (sqlite3, hashlib's OpenSSL parts...) ship as separate Pyodide packages.
try { await py.loadPackagesFromImports(${CODE}, { messageCallback: () => {} }); } catch {}
if (/\\bhashlib\\b|\\bssl\\b/.test(${CODE})) { try { await py.loadPackage(['hashlib', 'openssl'], { messageCallback: () => {} }); } catch {} }
window.__pgPost('ready', '');
try { await py.runPythonAsync(${CODE}); }
catch (e) {
  const msg = String(e.message || e).split('\\n');
  // Drop Pyodide's own frames, keep the user's part of the traceback.
  const i = msg.findIndex((l) => l.includes('File "<exec>"'));
  window.__pgPost('error', (i > 0 ? ['Traceback (most recent call last):', ...msg.slice(i)] : msg).join('\\n').trim());
}
window.__pgPost('done', '');`,
    });
  }

  if (lang === 'php') {
    return page({
      runId,
      script: `window.__pgPost('loading', 'php');
// The sandboxed (opaque-origin) iframe has no Locks API; php-wasm only needs a single-tab stand-in.
try {
  Object.defineProperty(navigator, 'locks', { configurable: true, value: {
    request: async (name, opts, cb) => (typeof opts === 'function' ? opts : cb)({ name, mode: 'exclusive' }),
    query: async () => ({ held: [], pending: [] }),
  } });
} catch {}
const { PhpWeb } = await import(${json(PHP_WASM)});
const php = new PhpWeb();
let buf = '';
php.addEventListener('output', (e) => { buf += e.detail; const parts = buf.split('\\n'); buf = parts.pop(); parts.forEach((l) => window.__pgPost('log', l)); });
php.addEventListener('error', (e) => window.__pgPost('error', String(e.detail).trim()));
await new Promise((r) => php.addEventListener('ready', r, { once: true }));
window.__pgPost('ready', '');
await php.run(${CODE});
if (buf) window.__pgPost('log', buf);
window.__pgPost('done', '');`,
    });
  }

  return null;
}
