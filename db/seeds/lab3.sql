-- Seed for chapter 5.6 onward. Written by tools/make_seed.py. Do not edit by hand.
-- requires: proposals, recipients, proposal_visits
-- loaded-if: select 1 from recipients where name like 'Seed %' limit 1
-- Recipient names start with 'Seed '.
begin;
set local time zone 'UTC';
delete from clicks where recipient_id in (select id from recipients where name like 'Seed %');
delete from reachouts where recipient_id in (select id from recipients where name like 'Seed %');
delete from proposal_visits where recipient_id in (select id from recipients where name like 'Seed %');
delete from recipients where name like 'Seed %';
delete from proposals where slug like 'seed-%';
insert into proposals (slug, title) values ('demo', 'Demo proposal') on conflict (slug) do nothing;
insert into proposals (slug, title) values ('seed-mentoring', 'Seed proposal: a mentoring plan') on conflict (slug) do nothing;
insert into recipients (proposal_id, name, token, created_at) values ((select id from proposals where slug = 'demo'), 'Seed Farah', 'DoAXDpL7wW-vCyh17_NrOQ', ((current_date - 8)::timestamp + interval '08:00:00'));
insert into recipients (proposal_id, name, token, created_at) values ((select id from proposals where slug = 'demo'), 'Seed Imran', '20cwXedCVveTBgCjWVqcOQ', ((current_date - 8)::timestamp + interval '08:00:00'));
insert into recipients (proposal_id, name, token, created_at) values ((select id from proposals where slug = 'seed-mentoring'), 'Seed Zara', 'GLwuaaCenZ2rKFHwebIH3w', ((current_date - 7)::timestamp + interval '08:00:00'));
insert into recipients (proposal_id, name, token, created_at) values ((select id from proposals where slug = 'seed-mentoring'), 'Seed Layla', '2Pkv3VfwmaRMCR972FreFQ', ((current_date - 7)::timestamp + interval '08:00:00'));
insert into recipients (proposal_id, name, token, created_at) values ((select id from proposals where slug = 'demo'), 'Seed Omar', 'tITpIpXWx1H8IRaN-Dy1KA', ((current_date - 7)::timestamp + interval '08:00:00'));
insert into proposal_visits (recipient_id, visit_key, fetched_at, opened_at, visible_seconds, sections_seen) values
  ((select id from recipients where name = 'Seed Farah'), 'ECJ1cO5R6vB1uuDwMKZxRw', ((current_date - 6)::timestamp + interval '10:00:00'), null, 0, '{}'::text[]),
  ((select id from recipients where name = 'Seed Imran'), 'oPS0r3aqJJ4u6x8HVEjSug', ((current_date - 5)::timestamp + interval '09:02:00'), ((current_date - 5)::timestamp + interval '09:02:06'), 95, '{ask,fit,trade-offs}'::text[]),
  ((select id from recipients where name = 'Seed Imran'), 'sYBZWCtZO4wcl9DA8v_5iA', ((current_date - 3)::timestamp + interval '15:05:00'), ((current_date - 3)::timestamp + interval '15:05:05'), 53, '{fit}'::text[]),
  ((select id from recipients where name = 'Seed Zara'), 'Q9ku6A7dBykOXoMf069Ryw', ((current_date - 4)::timestamp + interval '12:30:00'), ((current_date - 4)::timestamp + interval '12:30:07'), 10, '{}'::text[]),
  ((select id from recipients where name = 'Seed Layla'), 'QhbWle_4RfKgkGGm2ZPatg', ((current_date - 4)::timestamp + interval '17:00:00'), ((current_date - 4)::timestamp + interval '17:00:09'), 41, '{ask,reason}'::text[]);
commit;
