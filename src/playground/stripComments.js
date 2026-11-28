// Removes comments from example code so "predict the output" doesn't give the answer away
// (the examples put the expected output in comments). A small scanner that respects strings.

const STYLES = {
  js: { line: ['//'], block: true },
  ts: { line: ['//'], block: true },
  php: { line: ['//', '#'], block: true },
  python: { line: ['#'], block: false },
};

export function stripComments(code, lang) {
  const style = STYLES[lang];
  if (!style) return code;
  let out = '';
  let i = 0;
  let quote = null; // current string delimiter, or a python triple quote
  while (i < code.length) {
    const ch = code[i];
    if (quote) {
      if (ch === '\\') {
        out += code.slice(i, i + 2);
        i += 2;
        continue;
      }
      if (code.startsWith(quote, i)) {
        out += quote;
        i += quote.length;
        quote = null;
        continue;
      }
      out += ch;
      i += 1;
      continue;
    }
    if (lang === 'python' && (code.startsWith('"""', i) || code.startsWith("'''", i))) {
      quote = code.slice(i, i + 3);
      out += quote;
      i += 3;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }
    // JS regex literal: a "/" where an expression starts (not after a value).
    if ((lang === 'js' || lang === 'ts') && ch === '/' && code[i + 1] !== '/' && code[i + 1] !== '*') {
      const prev = out.replace(/\s+$/, '').slice(-1);
      if (prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || /\breturn$/.test(out.trimEnd())) {
        let j = i + 1;
        let inClass = false;
        while (j < code.length && code[j] !== '\n') {
          if (code[j] === '\\') j += 2;
          else {
            if (code[j] === '[') inClass = true;
            else if (code[j] === ']') inClass = false;
            else if (code[j] === '/' && !inClass) break;
            j += 1;
          }
        }
        if (code[j] === '/') {
          out += code.slice(i, j + 1);
          i = j + 1;
          continue;
        }
      }
    }
    if (style.block && code.startsWith('/*', i)) {
      const end = code.indexOf('*/', i + 2);
      i = end === -1 ? code.length : end + 2;
      continue;
    }
    // PHP 8 attributes start with #[ and are not comments.
    const lineStart = style.line.find((tok) => code.startsWith(tok, i) && !(lang === 'php' && code.startsWith('#[', i)));
    if (lineStart) {
      const end = code.indexOf('\n', i);
      i = end === -1 ? code.length : end;
      continue;
    }
    out += ch;
    i += 1;
  }
  // Drop lines that became empty because they only held a comment, trim trailing spaces,
  // and collapse runs of blank lines.
  const originalLines = code.split('\n');
  return out
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l, idx) => l !== '' || originalLines[idx]?.trim() === '')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
