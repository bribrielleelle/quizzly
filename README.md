# QuizWhiz 🌟

**Five subjects. Ten questions. How smart are your classmates?**

QuizWhiz is a quiz web app built for a high school AI-assisted web development course. Players register, take subject quizzes, track their history, and climb leaderboards; teachers manage questions through an editor and CSV imports.

> The repo keeps its original name (`quizzly`); the app's brand is **QuizWhiz**.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Plain HTML, CSS, JavaScript |
| Server | Node.js 24 LTS + Express 5 (one server for static files + API) |
| Database | Replit PostgreSQL, accessed with `pg` (parameterized SQL only) |
| Auth | bcryptjs password hashing + signed cookie sessions |
| Environments | Replit workspace (QA) · Replit Deployment (production, separate DB) |

## Project structure

```
├── server.js          # Express app: static files + API routes
├── src/
│   ├── db.js          # pg connection pool (reads DATABASE_URL)
│   ├── middleware.js  # requireAuth / requireTeacher
│   ├── auth.js        # register / login / logout / me
│   ├── migrate.js     # applies db/schema.sql
│   └── seed.js        # inserts the five subject quizzes
├── db/
│   └── schema.sql     # full database schema
├── public/            # frontend (HTML, CSS, JS)
└── docs/              # specification + question bank
```

## Setup (Replit)

1. Import this repo into a Replit workspace (or `git pull` if it's already there).
2. Create a **Replit PostgreSQL** database.
3. Add these **Secrets**:
   - `DATABASE_URL` — from your Replit Postgres instance
   - `SESSION_SECRET` — any long random string
   - `TEACHER_INVITE_CODE` — the code that registers an account as a teacher
4. Run:

```bash
npm install        # also generates package-lock.json — commit it!
npm run migrate    # create tables
npm run seed       # insert the five subject quizzes
npm start          # run the app
```

**Important:** the course requires `package-lock.json` in the repo. After your first `npm install`, commit the generated lock file.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the Express server |
| `npm run migrate` | Apply `db/schema.sql` to the database |
| `npm run seed` | Insert the five subject quizzes (idempotent) |
| `npm run setup` | migrate + seed in one go |

## Development phases

1. **Foundation + Authentication** — server, static frontend, database schema, register/login/logout, hashed passwords, player/teacher roles *(current phase)*
2. **Quiz Engine** — quiz selection, questions, scoring, results, retry
3. **Attempts + User History** — persisted attempts, timestamps, personal history
4. **Leaderboards + Admin Tools** — overall + per-quiz boards, question editor, CSV import
5. **Custom Features + Production Readiness** — timed quiz mode, answer explanations, testing, deployment

Full details in [`docs/spec.md`](docs/spec.md); all 50 quiz questions are drafted in [`docs/question-bank.md`](docs/question-bank.md).

## Security notes

- Passwords are hashed with bcryptjs — never stored or logged as plain text.
- All SQL uses `pg` parameter placeholders (`$1`, `$2`, …).
- Sessions are signed, httpOnly cookies.
- Secrets live in Replit Secrets only; never in this repo.
