// Seeds the five subject quizzes. Idempotent — safe to run repeatedly.
// Questions arrive in Phase 2 (from docs/question-bank.md).
const pool = require('./db');

const quizzes = [
  {
    title: 'Math',
    subject: 'math',
    description: 'Arithmetic, percentages, basic algebra and geometry — from warm-ups to head-scratchers.'
  },
  {
    title: 'Science',
    subject: 'science',
    description: 'Planets, chemistry, the human body and a little physics.'
  },
  {
    title: 'History',
    subject: 'history',
    description: 'Famous figures, milestone events and the stories behind them.'
  },
  {
    title: 'Geography',
    subject: 'geography',
    description: 'Capitals, oceans, rivers, mountains and continents.'
  },
  {
    title: 'English',
    subject: 'english',
    description: 'Vocabulary, grammar, parts of speech and literary devices.'
  }
];

async function seed() {
  for (const quiz of quizzes) {
    await pool.query(
      'INSERT INTO quizzes (title, subject, description) VALUES ($1, $2, $3) ON CONFLICT (title) DO NOTHING',
      [quiz.title, quiz.subject, quiz.description]
    );
    console.log('Seeded quiz: ' + quiz.title);
  }
  console.log('Seed complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
