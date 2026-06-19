-- Seed data for development
-- Run after: supabase migration up

-- Create a test user (password: test123456)
insert into auth.users (id, email, encrypted_password, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-000000000001',
  'searcher@test.com',
  crypt('test123456', gen_salt('bf')),
  '{"display_name": "Searcher User"}'
);

insert into auth.users (id, email, encrypted_password, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-000000000002',
  'uploader@test.com',
  crypt('test123456', gen_salt('bf')),
  '{"display_name": "Uploader User"}'
);

-- The trigger handle_new_user will insert into public.users automatically.
-- Update their roles:
update public.users
set role = 'searcher',
    city = 'Monywa',
    region = 'Sagaing',
    location = st_makepoint(95.1360, 22.1083)
where id = '00000000-0000-0000-0000-000000000001';

update public.users
set role = 'uploader',
    city = 'Yangon',
    region = 'Yangon',
    location = st_makepoint(96.1567, 16.8661)
where id = '00000000-0000-0000-0000-000000000002';

-- Sample jobs in Yangon
insert into public.jobs (uploader_id, title, description, work_type, location, address, city, region, price)
values
  ('00000000-0000-0000-0000-000000000002', 'ဆိုင်ရှေ့မှာ ဈေးရောင်းကူပေးမယ့်သူ', 'ဆိုင်ရှေ့မှာ မနက် ၈နာရီကနေ ညနေ ၄နာရီအထိ ဈေးရောင်းကူပေးဖို့ လိုပါတယ်', 'onsite', st_makepoint(96.1567, 16.8661), 'ဗိုလ်ချုပ်လမ်း', 'Yangon', 'Yangon', 15000);

insert into public.jobs (uploader_id, title, description, work_type, location, address, city, region, price)
values
  ('00000000-0000-0000-0000-000000000002', 'အိမ်သန့်ရှင်းရေးလုပ်ပေးမယ့်သူ', 'တိုက်ခန်း သန့်ရှင်းရေးလုပ်ပေးဖို့ လိုပါတယ်။ တစ်ပတ် ၂ခါ', 'onsite', st_makepoint(96.1687, 16.8381), 'ကမာရွတ်', 'Yangon', 'Yangon', 10000);

insert into public.jobs (uploader_id, title, description, work_type, location, address, city, region, price)
values
  ('00000000-0000-0000-0000-000000000002', 'စာရိုက်ကူးပေးမယ့်သူ', 'အွန်လိုင်းကနေ စာရိုက်ကူးပေးဖို့ လိုပါတယ်။ အင်တာနက်ရှိရုံနဲ့ ရပါတယ်', 'remote', null, 'အွန်လိုင်း', 'Yangon', 'Yangon', 8000);

insert into public.jobs (uploader_id, title, description, work_type, location, address, city, region, price)
values
  ('00000000-0000-0000-0000-000000000002', 'ဆိုင်ကယ်အပိုပစ္စည်းပို့ပေးမယ့်သူ', 'ဆိုင်ကယ်နဲ့ ပစ္စည်းပို့ပေးဖို့ လိုပါတယ်။ မြို့တွင်းပို့ဆောင်ရေးပါ', 'onsite', st_makepoint(96.1567, 16.8661), 'လမ်းမတော်', 'Yangon', 'Yangon', 12000);

insert into public.jobs (uploader_id, title, description, work_type, location, address, city, region, price)
values
  ('00000000-0000-0000-0000-000000000002', 'ဟိုတယ်ဧည့်ကြိုလုပ်ပေးမယ့်သူ', 'ဟိုတယ်မှာ ဧည့်ကြိုတာဝန်ထမ်းဆောင်ပေးဖို့ လိုပါတယ်', 'onsite', st_makepoint(96.1350, 16.8350), 'ဗဟန်း', 'Yangon', 'Yangon', 20000);

-- Sample jobs in Monywa
insert into public.jobs (uploader_id, title, description, work_type, location, address, city, region, price)
values
  ('00000000-0000-0000-0000-000000000002', 'ဆိုင်မှာ ကူညီလုပ်ကိုင်ပေးမယ့်သူ', 'ဆိုင်မှာ မနက်ခင်းအလုပ်ကူပေးဖို့ လိုပါတယ်', 'onsite', st_makepoint(95.1360, 22.1083), 'မြို့မဈေးအနီး', 'Monywa', 'Sagaing', 10000);
