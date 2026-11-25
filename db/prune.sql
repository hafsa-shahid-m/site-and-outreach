-- Retention: delete rows older than 12 months. Run it by hand on your live branch (chapter 6.9).
-- The privacy page must say the same number of months as the interval below, for every table it names.
-- It prints how many rows it removed from each table.
with
  v as (delete from views where at < now() - interval '12 months' returning 1),
  d as (delete from dropped where at < now() - interval '12 months' returning 1),
  pv as (delete from proposal_visits where fetched_at < now() - interval '12 months' returning 1),
  c as (delete from clicks where at < now() - interval '12 months' returning 1),
  r as (delete from reachouts where sent_at < now() - interval '12 months' returning 1),
  s as (delete from sessions where expires_at < now() returning 1)
select
  (select count(*) from v) as views_removed,
  (select count(*) from d) as dropped_removed,
  (select count(*) from pv) as proposal_visits_removed,
  (select count(*) from c) as clicks_removed,
  (select count(*) from r) as reachouts_removed,
  (select count(*) from s) as sessions_removed;
