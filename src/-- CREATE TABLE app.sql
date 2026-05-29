-- CREATE TABLE app.amendments (
--     _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

--     bill UUID REFERENCES app.bills(_id) ON DELETE CASCADE,
--     proposer_uuid UUID REFERENCES app.profile(_id) ON DELETE SET NULL,
--     stage UUID REFERENCES app.stages(_id) ON DELETE SET NULL,

--     author TEXT,
--     clause TEXT,
--     change TEXT,
--     justification TEXT,

--     status TEXT DEFAULT 'pending',

--     date TIMESTAMP DEFAULT NOW()
-- );

select * from app.stages

-- UPDATE app.stages
-- SET status='pending',
-- starting_date=NULL
-- WHERE _id='33be92d5-e93c-4a30-8842-380a5635f342'