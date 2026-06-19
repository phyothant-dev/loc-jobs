-- Seed data for hosted Supabase project
-- Run after 00003_nopostgis.sql in Supabase Dashboard → SQL Editor

-- Update user1 profile to Monywa
update public.users
set city = 'Monywa',
    region = 'Sagaing'
where id = '55d2369f-f553-4521-9d92-b5fdd96f4a4e';

-- Update uploader profile
update public.users
set display_name = 'Monywa Uploader',
    role = 'uploader',
    city = 'Monywa',
    region = 'Sagaing'
where id = '2936a442-fe3e-48a2-a2b8-d80dc23641dc';
