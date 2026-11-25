# Site and outreach

A personal site with an honest visitor counter, proposal pages that tell you when they were opened,
tracked links and one private dashboard. You build it in the course Level 2 (Dev Weekends).

```text
npm install
npx playwright install chromium
npm run doctor      checks Node, Git and the build, then (from chapter 4.4) your env vars and database
npm run dev         the site at http://localhost:3000
npm test            the unit tests. They fail on purpose: each failure names the chapter that fixes it
npm run design-check   measures your pages (needs npm run dev running in another terminal)
```

The unit tests need no database. They run your SQL in a small Postgres inside the test run.

Never commit `.env.local`. Copy `.env.example` to `.env.local` and fill it in (chapter 4.4).
