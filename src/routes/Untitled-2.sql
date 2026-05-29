-- -- -- ============================================================
-- -- -- SEED DATA — County Digital Skills and Innovation Hubs Bill, 2026
-- -- -- Replace these before running:
-- -- --   '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916'    → SELECT id FROM bills LIMIT 1;
-- -- --   '10199c54-d17f-441c-86b9-c4d7fe00c938'  → first senator UUID
-- -- --   '10199c54-d17f-441c-86b9-c4d7fe00c938'  → second senator UUID
-- -- --   '10199c54-d17f-441c-86b9-c4d7fe00c938'  → third senator UUID
-- -- -- ============================================================


-- -- -- ── ORIGINAL CLAUSES ─────────────────────────────────────────────────────────
-- -- -- Clauses 1-3: have amendments → individually voted
-- -- -- Clauses 12-17: no amendments → EN BLOC eligible

-- -- INSERT INTO app.clauses (id, bill_id, number, title, text, type, status, order_index) VALUES

-- -- -- PART I — PRELIMINARY
-- -- ('aaaaaaaa-0001-0000-0000-000000000001',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '1', 'Short Title',
-- --  'This Act may be cited as the County Digital Skills and Innovation Hubs Act, 2026.',
-- --  'original', 'not_voted', 1),

-- -- ('aaaaaaaa-0001-0000-0000-000000000002',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '2', 'Commencement',
-- --  'This Act shall come into operation upon publication in the Gazette.',
-- --  'original', 'not_voted', 2),

-- -- ('aaaaaaaa-0001-0000-0000-000000000003',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '3', 'Interpretation',
-- --  'In this Act, unless the context otherwise requires— "Cabinet Secretary" means the Cabinet Secretary responsible for ICT; "County Hub" means a County Digital Skills and Innovation Hub established under this Act; "digital skills" includes software development, artificial intelligence, cybersecurity, data analysis, digital marketing, remote work skills, and other ICT-related competencies; "innovation" includes the creation, development, and commercialization of new technologies, software, digital products, and services; "youth" has the meaning assigned under the Constitution and relevant laws; "Board" means the management board of a County Hub established under this Act.',
-- --  'original', 'not_voted', 3),

-- -- -- PART II — ESTABLISHMENT
-- -- ('aaaaaaaa-0001-0000-0000-000000000004',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '4', 'Establishment of County Innovation Hubs',
-- --  'Every county government shall establish and maintain at least one County Digital Skills and Innovation Hub within its jurisdiction. A county government may establish additional hubs based on population, geographic needs, and economic priorities. The hubs shall be accessible to youth, students, startups, innovators, and members of the public.',
-- --  'original', 'not_voted', 4),

-- -- ('aaaaaaaa-0001-0000-0000-000000000005',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '5', 'Functions of County Innovation Hubs',
-- --  'The functions of a County Hub shall include— providing affordable digital skills training; supporting software development and technology innovation; offering startup incubation and mentorship services; facilitating remote work and online employment opportunities; providing internet access and ICT infrastructure; supporting research and development in emerging technologies; promoting youth entrepreneurship and innovation; and facilitating partnerships between public institutions and private technology firms.',
-- --  'original', 'not_voted', 5),

-- -- -- PART III — MANAGEMENT AND GOVERNANCE
-- -- ('aaaaaaaa-0001-0000-0000-000000000006',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '6', 'Management Board',
-- --  'Each County Hub shall be managed by a Board appointed by the respective county government. The Board shall consist of— a chairperson appointed by the Governor; one representative from the county department responsible for ICT; one representative from a recognized university or TVET institution; one representative from the private technology sector; one representative of youth organizations; and the Hub Director who shall be the secretary to the Board.',
-- --  'original', 'not_voted', 6),

-- -- ('aaaaaaaa-0001-0000-0000-000000000007',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '7', 'Functions of the Board',
-- --  'The Board shall— oversee the administration of the Hub; approve training and innovation programs; mobilize partnerships and funding; ensure accountability and transparency; prepare annual reports on the Hub''s activities and performance.',
-- --  'original', 'not_voted', 7),

-- -- ('aaaaaaaa-0001-0000-0000-000000000008',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '8', 'Hub Director',
-- --  'Each Hub shall have a Director competitively recruited by the county government. The Director shall be responsible for the day-to-day management of the Hub.',
-- --  'original', 'not_voted', 8),

-- -- -- PART IV — DIGITAL TRAINING AND INNOVATION PROGRAMS
-- -- ('aaaaaaaa-0001-0000-0000-000000000009',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '9', 'Digital Skills Training',
-- --  'County Hubs shall provide training programs in— coding and software development; artificial intelligence and machine learning; digital entrepreneurship; cybersecurity; data analytics; online freelancing and remote work skills; and other emerging technologies. Training programs shall prioritize youth, women, and persons with disabilities.',
-- --  'original', 'not_voted', 9),

-- -- ('aaaaaaaa-0001-0000-0000-000000000010',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '10', 'Startup Incubation and Innovation Support',
-- --  'County Hubs may establish incubation programs for startups and innovators. Support may include— mentorship; co-working spaces; internet and digital infrastructure; business development services; access to investors and markets.',
-- --  'original', 'not_voted', 10),

-- -- ('aaaaaaaa-0001-0000-0000-000000000011',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '11', 'Partnerships',
-- --  'County governments may collaborate with— universities and TVET institutions; private technology companies; development partners; non-governmental organizations; and international organizations for the implementation of programs under this Act.',
-- --  'original', 'not_voted', 11),

-- -- -- PART V — FUNDING (no amendments → en bloc eligible)
-- -- ('aaaaaaaa-0001-0000-0000-000000000012',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '12', 'Sources of Funds',
-- --  'The funds of County Hubs shall consist of— monies appropriated by county assemblies; grants from the national government; donations and grants from development partners; income generated from services and programs; partnerships with private sector entities.',
-- --  'original', 'not_voted', 12),

-- -- ('aaaaaaaa-0001-0000-0000-000000000013',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '13', 'Financial Management',
-- --  'County governments shall ensure proper financial management of funds allocated under this Act. The accounts of each Hub shall be audited annually in accordance with public finance laws.',
-- --  'original', 'not_voted', 13),

-- -- -- PART VI — MONITORING, REPORTING, AND ACCOUNTABILITY (no amendments → en bloc eligible)
-- -- ('aaaaaaaa-0001-0000-0000-000000000014',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '14', 'Annual Reports',
-- --  'Every County Hub shall submit an annual report to the respective County Assembly. The report shall include— activities undertaken; number of beneficiaries trained; financial statements; innovation and startup outcomes; challenges and recommendations.',
-- --  'original', 'not_voted', 14),

-- -- ('aaaaaaaa-0001-0000-0000-000000000015',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '15', 'Monitoring and Evaluation',
-- --  'The Cabinet Secretary, in consultation with county governments, shall develop guidelines for monitoring and evaluating the implementation of this Act.',
-- --  'original', 'not_voted', 15),

-- -- -- PART VII — GENERAL PROVISIONS (no amendments → en bloc eligible)
-- -- ('aaaaaaaa-0001-0000-0000-000000000016',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '16', 'Regulations',
-- --  'The Cabinet Secretary may, in consultation with the Council of Governors, make regulations for the better carrying out of the provisions of this Act.',
-- --  'original', 'not_voted', 16),

-- -- ('aaaaaaaa-0001-0000-0000-000000000017',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '17', 'Transitional Provisions',
-- --  'Existing county innovation centers established before the commencement of this Act may be designated as County Digital Skills and Innovation Hubs under this Act.',
-- --  'original', 'not_voted', 17);


-- -- -- ── NEW CLAUSES (proposed by senators — voted individually) ──────────────────

-- -- INSERT INTO app.clauses (id, bill_id, number, title, text, type, status, proposed_by, order_index) VALUES

-- -- ('aaaaaaaa-0001-0000-0000-000000000018',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '18', 'National Coordination Framework',
-- --  'The Cabinet Secretary shall establish a National Coordination Framework to harmonize the activities of County Hubs across all forty-seven counties, share best practices, and ensure equitable access to national and international partnerships and funding opportunities.',
-- --  'new', 'not_voted', '10199c54-d17f-441c-86b9-c4d7fe00c938', 18),

-- -- ('aaaaaaaa-0001-0000-0000-000000000019',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '19', 'Persons with Disabilities Access',
-- --  'Every County Hub shall ensure that its physical premises, digital platforms, and training programs are fully accessible to persons with disabilities, and shall allocate not less than ten percent of its annual training slots specifically for persons with disabilities.',
-- --  'new', 'not_voted', '10199c54-d17f-441c-86b9-c4d7fe00c938', 19),

-- -- ('aaaaaaaa-0001-0000-0000-000000000020',
-- --  '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916', '20', 'Data Protection and Privacy',
-- --  'All County Hubs shall comply with the Data Protection Act, 2019 in the collection, storage, and processing of personal data of trainees, startups, and any other beneficiaries, and shall appoint a Data Protection Officer responsible for ensuring such compliance.',
-- --  'new', 'not_voted', '10199c54-d17f-441c-86b9-c4d7fe00c938', 20);

-- -- ALTER TABLE app.amendments
-- -- ADD COLUMN preview TEXT;

-- -- ── AMENDMENTS (all pending, no votes yet) ───────────────────────────────────

-- INSERT INTO app.amendments (_id, clause_id, bill, preview, change, justification, proposer_uuid, author, status) VALUES

-- -- ── Clause 2: Commencement ────────────────────────────────────────────────────
-- ('bbbbbbbb-0002-0000-0000-000000000001',
--  'aaaaaaaa-0001-0000-0000-000000000002', '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916',
--  'Set fixed commencement date of 90 days after assent',
--  'Replace "upon publication in the Gazette" with "ninety days after receiving Presidential assent, with publication of the commencement date in the Kenya Gazette at least thirty days before the Act comes into force".',
--  'A fixed commencement window gives county governments adequate time to prepare for implementation and avoid disruption.',
--  '10199c54-d17f-441c-86b9-c4d7fe00c938', 'Sen. Amina Halake', 'pending'),

-- -- ── Clause 3: Interpretation ─────────────────────────────────────────────────
-- ('bbbbbbbb-0002-0000-0000-000000000002',
--  'aaaaaaaa-0001-0000-0000-000000000003', '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916',
--  'Expand definition of "digital skills" to include agricultural technology',
--  'Amend the definition of "digital skills" to add: "precision agriculture technology, agri-tech platforms, and digital tools for the agricultural sector" to the list of ICT-related competencies.',
--  'Kenya''s predominantly agricultural economy requires that digital skills programmes address agri-tech to ensure rural communities are not left behind in the digital transformation.',
--  '10199c54-d17f-441c-86b9-c4d7fe00c938', 'Sen. Mutula Kilonzo Jr.', 'pending'),

-- ('bbbbbbbb-0002-0000-0000-000000000003',
--  'aaaaaaaa-0001-0000-0000-000000000003', '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916',
--  'Define "marginalized community" for equitable access',
--  'Insert new definition: "marginalized community" has the meaning assigned to it under Article 260 of the Constitution and shall be used to guide priority access to Hub services and training programmes.',
--  'Without a clear definition, marginalized communities risk being overlooked in Hub planning and resource allocation, undermining the Bill''s equity objectives.',
--  '10199c54-d17f-441c-86b9-c4d7fe00c938', 'Sen. Fatuma Dullo', 'pending'),

-- -- ── Clause 4: Establishment of County Innovation Hubs ────────────────────────
-- ('bbbbbbbb-0002-0000-0000-000000000004',
--  'aaaaaaaa-0001-0000-0000-000000000004', '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916',
--  'Require at least one hub per sub-county in densely populated counties',
--  'Add new subsection: "(4) In counties with a population exceeding one million persons, the county government shall establish not less than one County Hub in each sub-county within three years of the commencement of this Act."',
--  'A single hub per county is insufficient for high-density counties such as Nairobi, Kiambu, and Mombasa. Sub-county level hubs ensure equitable geographic access.',
--  '10199c54-d17f-441c-86b9-c4d7fe00c938', 'Sen. Amina Halake', 'pending'),

-- ('bbbbbbbb-0002-0000-0000-000000000005',
--  'aaaaaaaa-0001-0000-0000-000000000004', '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916',
--  'Mandate accessibility standards for Hub physical infrastructure',
--  'Insert new subsection: "(5) All County Hub premises shall be designed and maintained in compliance with accessibility standards prescribed under the Persons with Disabilities Act and shall include— ramps and accessible entrances; accessible washrooms; assistive technology workstations; and signage in Braille and large print."',
--  'Physical accessibility is fundamental to ensuring that persons with disabilities can benefit from Hub services on an equal basis with other citizens.',
--  '10199c54-d17f-441c-86b9-c4d7fe00c938', 'Sen. Mutula Kilonzo Jr.', 'pending'),

-- -- ── Clause 5: Functions of County Innovation Hubs ────────────────────────────
-- ('bbbbbbbb-0002-0000-0000-000000000006',
--  'aaaaaaaa-0001-0000-0000-000000000005', '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916',
--  'Add function to support women in technology programmes',
--  'Insert new paragraph after (g): "(h) developing and implementing dedicated programmes to increase women''s participation in technology, innovation, and digital entrepreneurship."',
--  'Women remain significantly underrepresented in the technology sector. A dedicated function will ensure County Hubs actively work to close the gender gap in digital skills.',
--  '10199c54-d17f-441c-86b9-c4d7fe00c938', 'Sen. Fatuma Dullo', 'pending'),

-- ('bbbbbbbb-0002-0000-0000-000000000007',
--  'aaaaaaaa-0001-0000-0000-000000000005', '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916',
--  'Add function to maintain public digital resource library',
--  'Insert new paragraph: "(i) maintaining a publicly accessible digital resource library including e-books, online courses, research materials, and open-source software tools available free of charge to Hub users."',
--  'A digital resource library ensures that Hub users can continue learning and accessing information independently, maximizing the impact of in-person training.',
--  '10199c54-d17f-441c-86b9-c4d7fe00c938', 'Sen. Amina Halake', 'pending'),

-- -- ── Clause 6: Management Board ───────────────────────────────────────────────
-- ('bbbbbbbb-0002-0000-0000-000000000008',
--  'aaaaaaaa-0001-0000-0000-000000000006', '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916',
--  'Add a women''s representative to Board composition',
--  'Amend Board composition to include: "one representative from a recognized women''s rights or gender equality organisation, nominated by the County Women Representative."',
--  'Gender representation on the Board is necessary to ensure that Hub programmes are designed with the needs of women and girls in mind and that gender equity is embedded in governance.',
--  '10199c54-d17f-441c-86b9-c4d7fe00c938', 'Sen. Mutula Kilonzo Jr.', 'pending'),

-- ('bbbbbbbb-0002-0000-0000-000000000009',
--  'aaaaaaaa-0001-0000-0000-000000000006', '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916',
--  'Set term limits for Board members',
--  'Insert new subsection: "(3) A Board member shall hold office for a term of three years and shall be eligible for re-appointment for one further term only. No person shall serve more than two consecutive terms on the same Board."',
--  'Term limits prevent entrenchment of leadership, encourage fresh perspectives, and uphold principles of accountability and good governance.',
--  '10199c54-d17f-441c-86b9-c4d7fe00c938', 'Sen. Fatuma Dullo', 'pending'),

-- -- ── Clause 9: Digital Skills Training ────────────────────────────────────────
-- ('bbbbbbbb-0002-0000-0000-000000000010',
--  'aaaaaaaa-0001-0000-0000-000000000009', '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916',
--  'Require nationally recognized certification for all training programmes',
--  'Insert new subsection: "(3) All training programmes offered under this section shall lead to a nationally recognized certification accredited by the Kenya National Qualifications Authority or an equivalent internationally recognized body."',
--  'Certification adds value to trainees'' skills by making them verifiable and marketable to employers, increasing the return on investment for both trainees and county governments.',
--  '10199c54-d17f-441c-86b9-c4d7fe00c938', 'Sen. Amina Halake', 'pending'),

-- ('bbbbbbbb-0002-0000-0000-000000000011',
--  'aaaaaaaa-0001-0000-0000-000000000009', '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916',
--  'Add Kiswahili and local languages instruction requirement',
--  'Insert new subsection: "(4) County Hubs shall ensure that training programmes are delivered in both English and Kiswahili, and where practicable, in the dominant local language of the county, to ensure maximum accessibility and comprehension."',
--  'Language barriers prevent many Kenyans, particularly in rural areas, from benefiting from digital training. Multilingual instruction dramatically increases programme reach and effectiveness.',
--  '10199c54-d17f-441c-86b9-c4d7fe00c938', 'Sen. Mutula Kilonzo Jr.', 'pending'),

-- -- ── Clause 11: Partnerships ───────────────────────────────────────────────────
-- ('bbbbbbbb-0002-0000-0000-000000000012',
--  'aaaaaaaa-0001-0000-0000-000000000011', '6ae4e7ca-1a39-46e0-ba42-a9023f3a0916',
--  'Require public disclosure of all partnership agreements',
--  'Insert new subsection: "(2) All partnership agreements entered into under this section shall be disclosed to the public through publication on the county government website and submission to the County Assembly within thirty days of signing."',
--  'Transparency in partnerships prevents conflicts of interest and ensures that partnership terms serve the public interest rather than private commercial interests.',
--  '10199c54-d17f-441c-86b9-c4d7fe00c938', 'Sen. Fatuma Dullo', 'pending');

SELECT * FROM app.amendments