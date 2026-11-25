// Runs before every test file. The tests use their own secrets and never touch your real database.
process.env.VISITOR_SECRET = "demo-secret-for-the-unit-tests";
process.env.OWNER_SECRET = "owner-secret-for-the-unit-tests";
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
