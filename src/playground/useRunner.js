import { useCallback, useEffect, useRef, useState } from 'react';
import { buildSrcdoc } from './sandbox.js';

// Languages that report their own end. The rest are "done" after a quiet period.
const SIGNALS_DONE = ['python', 'php'];
const QUIET_MS = 1200;
const MAX_LINES = 500;

let counter = 0;

/**
 * Runs code for one language in a sandboxed iframe and collects its output.
 * Render <iframe {...iframeProps} /> wherever the iframe should live (hidden or visible).
 */
export function useRunner(lang) {
  const [run, setRun] = useState(null); // { id, srcdoc }
  const [status, setStatus] = useState('idle'); // idle | loading | running | done
  const [lines, setLines] = useState([]);
  const [height, setHeight] = useState(0);
  const iframeRef = useRef(null);
  const quietTimer = useRef();

  useEffect(() => {
    if (!run) return undefined;
    const settleLater = () => {
      if (SIGNALS_DONE.includes(lang)) return;
      clearTimeout(quietTimer.current);
      quietTimer.current = setTimeout(() => setStatus((s) => (s === 'running' ? 'done' : s)), QUIET_MS);
    };
    const onMessage = (e) => {
      const msg = e.data;
      if (!msg || msg.__pg !== run.id || e.source !== iframeRef.current?.contentWindow) return;
      if (msg.type === 'loading') setStatus('loading');
      else if (msg.type === 'ready') {
        setStatus((s) => (s === 'done' ? s : 'running'));
        settleLater();
      } else if (msg.type === 'done') setStatus('done');
      else if (msg.type === 'height') setHeight(Math.min(Number(msg.text) || 0, 480));
      else {
        setLines((prev) => (prev.length >= MAX_LINES ? prev : [...prev, { type: msg.type, text: msg.text }]));
        settleLater();
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(quietTimer.current);
    };
  }, [run, lang]);

  const start = useCallback(
    (code) => {
      counter += 1;
      const id = `pg-${Date.now()}-${counter}`;
      setLines([]);
      setHeight(0);
      setStatus('loading');
      setRun({ id, srcdoc: buildSrcdoc(lang, code, id) });
    },
    [lang],
  );

  const stop = useCallback(() => {
    setRun(null);
    setStatus('idle');
  }, []);

  const reset = useCallback(() => {
    setRun(null);
    setStatus('idle');
    setLines([]);
  }, []);

  const iframeProps = run ? { ref: iframeRef, srcDoc: run.srcdoc, sandbox: 'allow-scripts' } : null;

  return { start, stop, reset, status, lines, setLines, height, runId: run?.id, iframeProps };
}
