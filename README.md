# Interview Prep

An interview preparation site built with React (Vite) and Tailwind CSS. It has study lessons, a quiz for each track, and a timed final exam, in Arabic and English with dark and light themes.

## Run

```bash
npm install
npm run dev
```

## Content

All lessons and questions live in `src/data/interview-data.json`.

- `lessons[]`: `id`, `title`, `points`, `code`, plus optional `short` (short answer) and `section` (group heading).
- `quiz[]`: `id`, `question`, `options`, `answer` (index of the correct option), `explanation`.

Options are shuffled every time a quiz or exam starts.
