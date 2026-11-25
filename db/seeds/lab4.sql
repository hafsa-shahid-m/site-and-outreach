-- Seed for chapter 6.3 onward. Written by tools/make_seed.py. Do not edit by hand.
-- requires: clicks, reachouts, recipients, proposal_visits
-- loaded-if: select 1 from reachouts where note = 'seed' limit 1
-- Reach-out notes are 'seed'. Click times carry 777777 microseconds.
begin;
set local time zone 'UTC';
delete from clicks where (extract(microseconds from at)::bigint % 1000000) = 777777;
delete from reachouts where note = 'seed';
insert into reachouts (sent_at, recipient_id, channel, note) values (((current_date - 6)::timestamp + interval '09:00:00'), (select id from recipients where name = 'Seed Farah'), 'linkedin', 'seed');
insert into reachouts (sent_at, recipient_id, channel, note) values (((current_date - 5)::timestamp + interval '08:00:00'), (select id from recipients where name = 'Seed Imran'), 'email', 'seed');
insert into reachouts (sent_at, recipient_id, channel, note) values (((current_date - 4)::timestamp + interval '12:00:00'), (select id from recipients where name = 'Seed Zara'), 'linkedin', 'seed');
insert into reachouts (sent_at, recipient_id, channel, note) values (((current_date - 3)::timestamp + interval '14:00:00'), (select id from recipients where name = 'Seed Layla'), 'whatsapp', 'seed');
insert into clicks (at, slug, recipient_id) values
  (((current_date - 5)::timestamp + interval '11:00:00' + interval '777777 microseconds'), 'example-project', (select id from recipients where name = 'Seed Imran')),
  (((current_date - 3)::timestamp + interval '16:00:00' + interval '777777 microseconds'), 'example-article', (select id from recipients where name = 'Seed Imran')),
  (((current_date - 2)::timestamp + interval '10:00:00' + interval '777777 microseconds'), 'example-project', (select id from recipients where name = 'Seed Layla')),
  (((current_date - 2)::timestamp + interval '10:10:00' + interval '777777 microseconds'), 'example-project', (select id from recipients where name = 'Seed Layla')),
  (((current_date - 3)::timestamp + interval '13:44:27' + interval '777777 microseconds'), 'example-project', null),
  (((current_date - 1)::timestamp + interval '13:29:35' + interval '777777 microseconds'), 'example-project', null),
  (((current_date - 7)::timestamp + interval '20:48:47' + interval '777777 microseconds'), 'example-project', null),
  (((current_date - 5)::timestamp + interval '19:41:19' + interval '777777 microseconds'), 'example-project', null),
  (((current_date - 7)::timestamp + interval '21:12:08' + interval '777777 microseconds'), 'example-project', null),
  (((current_date - 1)::timestamp + interval '11:53:12' + interval '777777 microseconds'), 'example-project', null),
  (((current_date - 2)::timestamp + interval '13:36:03' + interval '777777 microseconds'), 'example-project', null),
  (((current_date - 3)::timestamp + interval '12:52:55' + interval '777777 microseconds'), 'example-article', null),
  (((current_date - 2)::timestamp + interval '20:10:38' + interval '777777 microseconds'), 'example-article', null),
  (((current_date - 6)::timestamp + interval '08:52:38' + interval '777777 microseconds'), 'example-article', null),
  (((current_date - 2)::timestamp + interval '10:10:14' + interval '777777 microseconds'), 'example-article', null);
commit;
