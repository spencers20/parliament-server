-- -- SELECT * FROM app.deadbills
-- CREATE TABLE app.deadbills(
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     bill UUID references app.bills(_id),
--     stage UUID references app.stages(_id),
--     reason TEXT,
--     date TIMESTAMP DEFAULT NOW()

-- )

SELECT * FROM app.stakeholder_review_requests

-- INSERT INTO app.deadbills(
--     bill 
-- )