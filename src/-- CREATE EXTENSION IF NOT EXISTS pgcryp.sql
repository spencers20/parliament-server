-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- CREATE SCHEMA app;
-- CREATE TABLE app.profile(
--     _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     id_number TEXT NOT NULL,
--     email TEXT UNIQUE,
--     phone_number TEXT,
--     dob DATE,
--     role TEXT NOT NULL,
--     password TEXT
-- );

-- CREATE TABLE app.bills(
--     _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     bill_number TEXT,
--     title TEXT,
--     sponsor UUID REFERENCES app.profile(_id) ON DELETE SET NULL,
--     summary TEXT,
--     bill TEXT ,--url
--     objectives TEXT[]
-- )

-- CREATE TABLE app.stages(
--     _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     bill UUID REFERENCES app.bills(_id) ON DELETE CASCADE,
--     index INTEGER NOT NULL,
--     name TEXT NOT NULL,
--     status TEXT NOT NULL,
--     starting_date TIMESTAMP,
--     completed_date TIMESTAMP 
-- )

-- CREATE TABLE app.stage_actions(
--     _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     stage UUID REFERENCES app.stages(_id) ON DELETE CASCADE,
--     name TEXT NOT NULL,
--     responsibility TEXT NOT NULL,
--     status TEXT NOT NULL,
--     index INTEGER NOT NULL,
--     performed_time TIMESTAMP
-- )

-- CREATE TABLE app.billversions(
--     _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     bill UUID REFERENCES app.bills(_id) ON DELETE CASCADE,
--     responsible UUID REFERENCES app.profile(_id) ON DELETE CASCADE,
--     stage UUID REFERENCES app.stages(_id) ON DELETE CASCADE,
--     version TEXT NOT NULL, --url
--     -- version UUID REFERENCES app.versions(_id) ON DELETE CASCADE,
--     time_created TIMESTAMP NOT NULL
--     -- action TEXT NOT NULL,

-- )

    -- CREATE TABLE app.audits(
    --     _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    --     bill UUID REFERENCES app.bills(_id) ON DELETE CASCADE,
    --     responsible UUID REFERENCES app.profile(_id) ON DELETE CASCADE,
    --     stage UUID REFERENCES app.stages(_id) ON DELETE CASCADE,
    --     version UUID REFERENCES app.billversions(_id) ON DELETE CASCADE,
    --     time TIMESTAMP NOT NULL,
    --     action TEXT NOT NULL

    -- )

ALTER TABLE app.profile
ADD CONSTRAINT unique_id_number UNIQUE (id_number);

-- select * from app.profile
-- SELECT  COUNT(*) From app.profile where id_number=4

-- ALTER TABLE app.profile
-- ALTER COLUMN id_number TYPE BIGINT
-- USING id_number::BIGINT;

CREATE TABLE app.amendments (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    bill UUID REFERENCES app.bills(_id) ON DELETE CASCADE,
    proposer_uuid UUID REFERENCES app.profile(_id) ON DELETE SET NULL,
    stage UUID REFERENCES app.stages(_id) ON DELETE SET NULL,

    author TEXT,
    clause TEXT,
    change TEXT,
    justification TEXT,

    status TEXT DEFAULT 'pending',

    date TIMESTAMP DEFAULT NOW()
);