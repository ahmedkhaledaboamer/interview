import { useCallback, useState } from 'react';
import ExamResult from '../components/exam/ExamResult.jsx';
import ExamRunner from '../components/exam/ExamRunner.jsx';
import ExamSetup from '../components/exam/ExamSetup.jsx';
import { useApp } from '../hooks/useApp.jsx';
import { buildExam, examConfig, examDurationMinutes, percent, tracks } from '../utils/quiz.js';
import { quizKey } from '../utils/review.js';

export default function FinalExam() {
  const { t, recordExamScore, recordReview } = useApp();
  const [phase, setPhase] = useState('setup');
  const [selected, setSelected] = useState(() => tracks.map((tr) => tr.id));
  const [exam, setExam] = useState(null);
  const [result, setResult] = useState(null);

  const start = (ids) => {
    const questions = buildExam(ids, examConfig.questionCount);
    const minutes = examDurationMinutes(questions.length);
    setExam({ questions, deadline: Date.now() + minutes * 60_000 });
    setResult(null);
    setPhase('running');
    window.scrollTo(0, 0);
  };

  const submit = useCallback(
    (answers, timeUp) => {
      if (!exam) return;
      const { questions } = exam;
      const correct = questions.filter((q) => answers[q.id] === q.correct).length;
      const isBest = recordExamScore(percent(correct, questions.length));
      // Wrong answers go to spaced review (unanswered ones are skipped: running out of time isn't a mistake).
      for (const q of questions) {
        if (answers[q.id] !== undefined && answers[q.id] !== q.correct) {
          recordReview(quizKey(q.id), false, { meta: { kind: 'quiz', trackId: q.trackId } });
        }
      }
      setResult({ questions, answers, timeUp, isBest });
      setExam(null);
      setPhase('result');
      window.scrollTo(0, 0);
    },
    [exam, recordExamScore, recordReview],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6">
      {phase !== 'result' && (
        <header className="mb-8">
          <p className="flex items-center gap-3 font-mono text-sm text-accent-text" dir="ltr">
            <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-accent" />
            ~/ahmed $ exam --final
          </p>
          <h1 className="mt-3 text-5xl font-bold tracking-tighter sm:text-6xl">{t('exam.title')}</h1>
          {phase === 'setup' && <p className="mt-3 max-w-2xl text-lg text-muted">{t('exam.sub')}</p>}
        </header>
      )}

      {phase === 'setup' && <ExamSetup selected={selected} onChange={setSelected} onStart={start} />}
      {phase === 'running' && exam && (
        <ExamRunner questions={exam.questions} deadline={exam.deadline} onSubmit={submit} />
      )}
      {phase === 'result' && result && <ExamResult result={result} onRestart={() => setPhase('setup')} />}
    </div>
  );
}
