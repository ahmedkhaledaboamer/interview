import { useEffect, useRef, useState } from 'react';
import { useApp } from '../hooks/useApp.jsx';
import Icon from './Icon.jsx';

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('copy failed');
}

export default function CodeBlock({ code, label = 'code' }) {
  const { t } = useApp();
  const [status, setStatus] = useState('idle');
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  const onCopy = async () => {
    try {
      await copyText(code);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), 1800);
  };

  const text = { copied: t('code.copied'), failed: t('code.failed'), idle: t('code.copy') }[status];

  return (
    <div dir="ltr" className="overflow-hidden rounded-2xl border border-line bg-code-bg text-code-fg">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ms-2 font-mono text-xs text-white/45">{label}</span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          aria-label={t('code.copyLabel')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
            status === 'copied'
              ? 'bg-accent text-accent-fg'
              : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
          }`}
        >
          <Icon name={status === 'copied' ? 'check' : 'copy'} className="size-3.5" />
          <span aria-live="polite">{text}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed sm:p-5 sm:text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}
