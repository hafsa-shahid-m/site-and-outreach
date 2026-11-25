-- The tables of the site. Safe to run again and again: every table is "create table if not exists".
-- Run it with: node db/migrate.mjs

-- YOUR TURN start views-table
-- Chapter 4.4. Make the views table. These five column names are fixed: at, path, referrer_host, visitor, device.
-- YOUR TURN end views-table

-- Pre-wired: what the filters dropped, so the dashboard can show the filtered share.
create table if not exists dropped (
  id bigserial primary key,
  at timestamptz not null default now(),
  surface text not null,           -- 'view', 'proposal' or 'click'
  reason text not null             -- 'robot', 'empty-agent', 'prefetch', 'head' or 'owner'
);

-- Pre-wired: the owner's login sessions (chapter 4.10).
create table if not exists sessions (
  id text primary key,             -- 32 random bytes, base64url
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- YOUR TURN start proposals-recipients
-- Chapter 5.4. Make the proposals and recipients tables.
-- YOUR TURN end proposals-recipients

-- YOUR TURN start proposal-visits
-- Chapter 5.6. Make the proposal_visits table.
-- YOUR TURN end proposal-visits

-- YOUR TURN start clicks-table
-- Chapter 6.3. Make the clicks table. Tracked link targets live in links.ts, not here.
-- YOUR TURN end clicks-table

-- YOUR TURN start reachouts-table
-- Chapter 6.4. Make the reachouts table.
-- YOUR TURN end reachouts-table
