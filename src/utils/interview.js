// Mock interview helpers: question picking and a simple, transparent answer check
// (which key terms from the model answer did you mention, how fast you spoke, filler words).
import { shuffle, tracks } from './quiz.js';

const STOP = new Set(
  `a an the and or but if then else when while of to in on at by for with without from into onto over under about as is are was
  were be been being am do does did done have has had having it its it's this that these those there here what which who whom whose
  why how can could should would will shall may might must not no yes so than too very just also only even more most less least
  such same other another each every all any both either neither few many much some one two three first second you your yours
  we our ours they their them he she his her him i me my mine us out up down off again once use used using uses make makes made
  get gets got like way thing things something able because instead before after between need needs within without per via e.g
  i.e etc let lets keep keeps give gives gave say says said tell show shows mean means meaning good better best well`.split(/\s+/),
);

// Fillers worth noticing when practising spoken English.
const FILLERS = ['um', 'uh', 'erm', 'hmm', 'like', 'you know', 'basically', 'actually', 'literally', 'i mean', 'kind of', 'sort of'];

/** The English answer we compare against. */
export function modelAnswer(lesson) {
  if (lesson.say) return lesson.say;
  return [lesson.short?.en, ...(lesson.points?.en ?? [])].filter(Boolean).join(' ');
}

const stem = (w) =>
  w
    .toLowerCase()
    .replace(/[’']s$/, '')
    .replace(/(ies)$/, 'y')
    .replace(/(ing|ed|es|s)$/, '')
    .replace(/e$/, '');

const words = (text) => (text.toLowerCase().match(/[a-z0-9][a-z0-9+#.\-/]*[a-z0-9+#]|[a-z0-9]/g) ?? []);

/** Key terms from the model answer, in order of appearance (max 12). */
export function keyTerms(lesson) {
  const seen = new Set();
  const out = [];
  for (const w of words(modelAnswer(lesson))) {
    if (w.length < 3 || STOP.has(w) || /^\d+$/.test(w)) continue;
    const s = stem(w);
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(w);
    if (out.length >= 12) break;
  }
  return out;
}

export function countFillers(text) {
  const t = ` ${text.toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ')} `;
  const found = {};
  for (const f of FILLERS) {
    const n = t.split(` ${f} `).length - 1;
    if (n) found[f] = n;
  }
  return found;
}

/** Scores a spoken (or typed) answer against the lesson. */
export function scoreAnswer(lesson, transcript, seconds) {
  const terms = keyTerms(lesson);
  const spoken = words(transcript);
  // Speech-to-text writes "next.js" as "next js" and "node.js" as "node js": also match glued neighbours.
  const flat = (w) => stem(w.replace(/[^a-z0-9+#]/g, ''));
  const said = new Set([
    ...spoken.map(stem),
    ...spoken.map(flat),
    ...spoken.slice(1).map((w, i) => flat(spoken[i] + w)),
  ]);
  const hits = terms.map((term) => ({ term, hit: said.has(stem(term)) || said.has(flat(term)) }));
  const wordCount = words(transcript).length;
  const coverage = terms.length ? Math.round((hits.filter((h) => h.hit).length / terms.length) * 100) : 0;
  return {
    hits,
    coverage,
    wordCount,
    wpm: seconds > 5 ? Math.round((wordCount / seconds) * 60) : null,
    fillers: countFillers(transcript),
  };
}

/** Lessons from the chosen tracks, shuffled, without repeating the same question text. */
export function pickQuestions(trackIds, count) {
  const seen = new Set();
  const pool = [];
  for (const tr of tracks) {
    if (!trackIds.includes(tr.id)) continue;
    for (const lesson of tr.lessons) {
      const key = lesson.title.en.toLowerCase();
      if (seen.has(key) || !modelAnswer(lesson)) continue;
      seen.add(key);
      pool.push({ lesson, track: tr });
    }
  }
  return shuffle(pool).slice(0, count);
}

export function speechSupport() {
  if (typeof window === 'undefined') return { recognition: false, synthesis: false, recorder: false };
  return {
    recognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    synthesis: 'speechSynthesis' in window,
    recorder: !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder),
  };
}
