import data from '../data/interview-data.json';

export const tracks = data.tracks;
export const examConfig = data.finalExam;

export function getTrack(id) {
  return tracks.find((tr) => tr.id === id);
}

export function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Turns a raw quiz item into a playable question with shuffled options.
 * `correct` is the index of the right option *after* shuffling.
 */
export function prepareQuestion(item, trackId) {
  const order = shuffle(item.options.map((_, i) => i));
  return {
    id: item.id,
    trackId,
    question: item.question,
    explanation: item.explanation,
    options: order.map((i) => item.options[i]),
    correct: order.indexOf(item.answer),
  };
}

export function buildTrackQuiz(track) {
  return shuffle(track.quiz).map((q) => prepareQuestion(q, track.id));
}

/**
 * Draws questions evenly across the chosen tracks (round-robin over shuffled pools)
 * until `limit` is reached or every pool is empty, then shuffles the result.
 */
export function buildExam(trackIds, limit) {
  const pools = trackIds
    .map(getTrack)
    .filter(Boolean)
    .map((tr) => ({ trackId: tr.id, items: shuffle(tr.quiz) }));

  const picked = [];
  let round = 0;
  while (picked.length < limit) {
    let added = false;
    for (const pool of shuffle(pools)) {
      if (picked.length >= limit) break;
      const item = pool.items[round];
      if (item) {
        picked.push(prepareQuestion(item, pool.trackId));
        added = true;
      }
    }
    if (!added) break;
    round++;
  }
  return shuffle(picked);
}

export function totalQuestions(trackIds) {
  return trackIds.reduce((sum, id) => sum + (getTrack(id)?.quiz.length ?? 0), 0);
}

/** Scales the configured duration to the number of questions actually drawn. */
export function examDurationMinutes(count) {
  const { questionCount, durationMinutes } = examConfig;
  if (count >= questionCount) return durationMinutes;
  return Math.max(1, Math.round((durationMinutes * count) / questionCount));
}

export function percent(correct, total) {
  return total ? Math.round((correct / total) * 100) : 0;
}
