# Taekwondo Club

Web app for running a kids' taekwondo club with several branches: enrolment, monthly fees,
uniform stock, attendance and reports, in English and Amharic.

## What it does

- **Branches (multi-tenant).** Every kid, payment, uniform and attendance mark belongs to one branch.
  Staff accounts see only their branch; the owner account sees all branches and manages staff.
- **Seasons.** School season (default Sep–Jun): classes on weekends. Summer (default 15 Jun–10 Sep):
  Monday to Saturday. Dates and days are set per branch in Settings.
- **Class times.** Default 3–4, 4–5, 5–6 morning and 8–9 afternoon (Ethiopian time; stored as
  09:00–15:00). The afternoon class does not run on Sunday. Each kid trains in one class time.
- **Enrolment.** One parent, any number of kids, one payment (Cash, Telebirr, CBE, Bank of Abyssinia,
  with an optional transaction number). Optional uniform for each kid. Printable receipt.
  Entering an existing parent's phone offers to add the kids to that family.
- **Fees and expiry.** Monthly fee per kid. Paying early continues from the current end date.
  Expiry colours: yellow at 7 days left, red at 2 days, solid red when expired (both editable).
  "Classes left" counts real class days in the season.
- **Uniforms.** Per size: ordered (on the way), in stock, sold. Supplier orders count as stock once
  marked received. Sales can be part of enrolment or separate (any buyer). Stock counts fix drift.
- **Attendance.** One register per class time per day; reports show attendance rate per day,
  weekday, class time and kid, and flag kids who missed 3+ classes in a row.
- **Languages.** English / Amharic toggle on every page. Amharic shows Ethiopian calendar dates
  and Ethiopian clock times.
- **Accessibility.** Designed to WCAG 2.2 AAA contrast (7:1 text), 44px+ touch targets, visible focus,
  labelled fields, status shown with words and icons as well as colour.

## Run it locally

The local setup uses a throwaway SQLite file, never the database in `backend/.env`.

```bash
cd backend && DATABASE_URL=sqlite+aiosqlite:///./dev.db uv run python -m scripts.dev_seed
```

```bash
cd backend && DATABASE_URL=sqlite+aiosqlite:///./dev.db APP_ENV=development uv run uvicorn main:app --port 8010
```

```bash
VITE_API_URL=http://127.0.0.1:8010/api/v1 npm run dev
```

Demo sign-in details are in `backend/scripts/dev_seed.py` (local demo data only).

## Tests

```bash
npm run lint && npm test
```

```bash
cd backend && uv run pytest
```

## Deploying

`alembic upgrade head` runs migration `20261120_0009`, which adds the branch tables, creates a first
branch called "Main branch" with the default class times and sizes, and links existing staff accounts
to it. It is additive: the old gym tables stay in the database untouched.
After deploying, set the monthly fee and uniform price in Settings.
