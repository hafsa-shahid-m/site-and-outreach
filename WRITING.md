# Writing notes

For each article, three lines: what it is about, what you cut, what was hard.

## Article 1: The night a retry loop ate my queue

- About: a payment queue that stopped moving because a retry loop had no wait and no limit.
- Cut: a paragraph about being tired on call, and two lines of apology to the customer who got 312 receipts.
- Hard: writing the fix without making it sound like I knew the answer from the start.

## Article 2: A cursor that forgot where it was

- About: Queue Doctor reported the same 50 stuck jobs four times because I paged by rows kept, not rows read.
- Cut: twenty minutes of reading about distinct that led nowhere.
- Hard: keeping it short. The bug was one line and the story wanted to be longer.
