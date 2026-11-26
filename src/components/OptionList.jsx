import { useApp } from '../hooks/useApp.jsx';
import Icon from './Icon.jsx';

const LETTERS = { en: ['A', 'B', 'C', 'D', 'E', 'F'], ar: ['أ', 'ب', 'ج', 'د', 'هـ', 'و'] };

/**
 * Renders answer options as large buttons.
 * - `reveal` shows correct/incorrect colouring (quiz feedback).
 * - Without `reveal`, the selected option is simply highlighted (exam mode).
 */
export default function OptionList({ options, selected, correct, reveal = false, locked = false, onSelect, labelledBy }) {
  const { pick, lang } = useApp();

  return (
    <div role="group" aria-labelledby={labelledBy} className="grid gap-3">
      {options.map((opt, i) => {
        const isSelected = selected === i;
        const isCorrect = reveal && i === correct;
        const isWrong = reveal && isSelected && i !== correct;

        let tone = 'border-line bg-card hover:border-line-strong hover:bg-card-2';
        if (isCorrect) tone = 'border-ok/60 bg-ok/10';
        else if (isWrong) tone = 'border-bad/60 bg-bad/10';
        else if (isSelected) tone = 'border-accent bg-accent/10 ring-1 ring-accent/50';
        else if (reveal) tone = 'border-line bg-card opacity-60';

        let badge = 'bg-card-2 text-muted';
        if (isCorrect) badge = 'bg-ok text-white dark:text-black';
        else if (isWrong) badge = 'bg-bad text-white dark:text-black';
        else if (isSelected) badge = 'bg-accent text-accent-fg';

        return (
          <button
            key={i}
            type="button"
            disabled={locked}
            aria-pressed={isSelected}
            onClick={() => onSelect(i)}
            className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-start transition duration-200 disabled:cursor-default sm:px-5 ${tone} ${
              !locked ? 'motion-safe:hover:-translate-y-0.5' : ''
            }`}
          >
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-xl text-sm font-bold transition-colors ${badge}`}
            >
              {isCorrect ? (
                <Icon name="check" className="size-4" strokeWidth={3} />
              ) : isWrong ? (
                <Icon name="x" className="size-4" strokeWidth={3} />
              ) : (
                (LETTERS[lang] ?? LETTERS.en)[i]
              )}
            </span>
            <span className="min-w-0 flex-1 break-words">
              <bdi>{pick(opt)}</bdi>
            </span>
          </button>
        );
      })}
    </div>
  );
}
