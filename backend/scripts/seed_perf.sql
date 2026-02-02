-- Performance seed for PostgreSQL
-- Generates: 5000 users, 2-4 surveys per user, 4-6 questions per survey,
-- and ~8-12 responses per survey with answers.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Optional users table for perf tests (not used by app code, safe to ignore)
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  email text NOT NULL,
  created_at timestamp NOT NULL
);

-- Clean existing data (order matters if FK constraints exist)
TRUNCATE TABLE response_answers, survey_responses, survey_options, questions, surveys RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

DO $$
DECLARE
  user_count int := 5000;
  surveys_per_user_min int := 2;
  surveys_per_user_max int := 4;
  questions_per_survey_min int := 4;
  questions_per_survey_max int := 6;
  responses_per_survey_min int := 8;
  responses_per_survey_max int := 12;
  options_per_question_min int := 3;
  options_per_question_max int := 5;
  base_time timestamp := timestamp '2026-01-01 00:00:00';

  u int;
  s int := 1;
  q int := 1;
  o int := 1;

  survey_count int;
  question_count int;
  option_count int;
  survey_id text;
  question_id text;
  q_type text;
  status text;
  has_other boolean;
BEGIN
  -- Create users
  FOR u IN 1..user_count LOOP
    INSERT INTO users (id, display_name, email, created_at)
    VALUES (
      format('u%05s', u),
      format('User %s', u),
      format('user%05s@company.com', u),
      base_time + (u % 365) * interval '1 day'
    );
  END LOOP;

  -- Create surveys per user
  FOR u IN 1..user_count LOOP
    survey_count := floor(random() * (surveys_per_user_max - surveys_per_user_min + 1))::int + surveys_per_user_min;
    FOR i IN 1..survey_count LOOP
      survey_id := format('s%06s', s);
      status := (ARRAY['DRAFT','PUBLISHED','CLOSED','ARCHIVED'])[floor(random() * 4)::int + 1];

      INSERT INTO surveys (
        id, owner_id, title, description, status,
        is_anonymous, allow_edit_after_submit, allow_multiple_submissions,
        start_time, end_time, max_participants,
        created_at, updated_at
      ) VALUES (
        survey_id,
        format('u%05s', u),
        format('Survey %s', survey_id),
        format('Seeded survey %s for performance testing.', survey_id),
        status,
        (random() < 0.2),
        (random() < 0.7),
        (random() < 0.3),
        base_time + (s % 365) * interval '1 day',
        base_time + ((s % 365) + 30) * interval '1 day',
        CASE WHEN random() < 0.3 THEN (floor(random() * 500) + 50)::int ELSE NULL END,
        base_time + (s % 365) * interval '1 day',
        base_time + (s % 365) * interval '1 day'
      );

      -- Create questions for this survey
      question_count := floor(random() * (questions_per_survey_max - questions_per_survey_min + 1))::int + questions_per_survey_min;
      FOR j IN 1..question_count LOOP
        question_id := format('q%07s', q);
        q_type := (ARRAY['RATING','SINGLE_CHOICE','MULTIPLE_CHOICE'])[floor(random() * 3)::int + 1];

        IF q_type IN ('SINGLE_CHOICE','MULTIPLE_CHOICE') THEN
          option_count := floor(random() * (options_per_question_max - options_per_question_min + 1))::int + options_per_question_min;
        ELSE
          option_count := 0;
        END IF;

        has_other := (q_type = 'MULTIPLE_CHOICE' AND random() < 0.2);

        INSERT INTO questions (
          id, type, title, description, mandatory,
          has_other, other_label, min_select, max_select,
          survey_id
        ) VALUES (
          question_id,
          q_type,
          format('Question %s', question_id),
          CASE WHEN random() < 0.3 THEN 'Seeded description' ELSE NULL END,
          (random() < 0.8),
          has_other,
          CASE WHEN has_other THEN 'Other' ELSE NULL END,
          CASE WHEN q_type = 'MULTIPLE_CHOICE' THEN 1 ELSE NULL END,
          CASE WHEN q_type = 'MULTIPLE_CHOICE' THEN LEAST(3, option_count) ELSE NULL END,
          survey_id
        );

        IF q_type IN ('SINGLE_CHOICE','MULTIPLE_CHOICE') THEN
          FOR k IN 1..option_count LOOP
            INSERT INTO survey_options (id, text, skip_to_question_id, question_id)
            VALUES (
              format('o%08s', o),
              format('Option %s', o),
              NULL,
              question_id
            );
            o := o + 1;
          END LOOP;
        END IF;

        q := q + 1;
      END LOOP;

      s := s + 1;
    END LOOP;
  END LOOP;

  -- Create responses per survey (~10 each)
  INSERT INTO survey_responses (id, survey_id, user_id, submitted_at)
  SELECT
    gen_random_uuid()::text,
    s.id,
    format('u%05s', (floor(random() * user_count) + 1)::int),
    base_time + (floor(random() * 365)) * interval '1 day'
      + (floor(random() * 86400)) * interval '1 second'
  FROM surveys s
  CROSS JOIN LATERAL generate_series(
    1,
    (floor(random() * (responses_per_survey_max - responses_per_survey_min + 1)) + responses_per_survey_min)::int
  ) AS g;

  -- Create answers for each response/question pair
  INSERT INTO response_answers (response_id, question_id, answer)
  SELECT
    r.id,
    q.id,
    CASE q.type
      WHEN 'RATING' THEN to_jsonb((floor(random() * 5) + 1)::int)::text
      WHEN 'SINGLE_CHOICE' THEN (
        SELECT to_jsonb(o.id)::text
        FROM survey_options o
        WHERE o.question_id = q.id
        ORDER BY random()
        LIMIT 1
      )
      WHEN 'MULTIPLE_CHOICE' THEN (
        SELECT to_jsonb(ARRAY(
          SELECT o.id
          FROM survey_options o
          WHERE o.question_id = q.id
          ORDER BY random()
          LIMIT (floor(random() * 3) + 1)::int
        ))::text
      )
      ELSE to_jsonb('')::text
    END
  FROM survey_responses r
  JOIN questions q ON q.survey_id = r.survey_id;
END $$;
