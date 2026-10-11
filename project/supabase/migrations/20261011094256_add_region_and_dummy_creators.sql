/*
# Add region column to public_profiles and insert dummy creators

## Changes
1. Adds `region` column (text, nullable) to `public_profiles` for regional rankings.
2. Inserts 12 dummy public creators with varied Elo, regions, categories, and verified status
   so the rankings page has data to display.

## Security
- No policy changes. The new column inherits existing open RLS policies.

## Important Notes
1. Uses ON CONFLICT (id) DO UPDATE to be idempotent — re-running won't error.
2. Dummy IDs are stable hex strings so they don't collide with real crypto hashes.
3. Regions: North America, Europe, Asia, South America, Africa, Oceania.
*/

ALTER TABLE public_profiles ADD COLUMN IF NOT EXISTS region text;

CREATE INDEX IF NOT EXISTS idx_public_profiles_region ON public_profiles(region);

INSERT INTO public_profiles (id, handle, display_name, bio, public_key, elo, debates_won, debates_lost, avatar_seed, categories, is_verified, is_live, follower_count, region)
VALUES
  ('dummy_a1b2c3d4e5f60001', '@socrates_42',   'Socrates Returns',  'Philosophy is not a luxury. It is the air we breathe.', 'pk_dummy_a1b2c3d4e5f60001', 2850, 42, 8,  'socrates',  ARRAY['Philosophy','Politics'], true,  false, 1280, 'Europe'),
  ('dummy_a1b2c3d4e5f60002', '@newton_apple',  'Newton''s Apple',   'Gravity is law. So is evidence.',                       'pk_dummy_a1b2c3d4e5f60002', 2720, 38, 10, 'newton',    ARRAY['Science'],              true,  true,  980,  'North America'),
  ('dummy_a1b2c3d4e5f60003', '@nightowl_99',   'Night Owl',         'I argue best at 3am. Bring coffee.',                    'pk_dummy_a1b2c3d4e5f60003', 2610, 31, 12, 'nightowl',  ARRAY['Politics','Law'],       false, false, 640,  'North America'),
  ('dummy_a1b2c3d4e5f60004', '@dubai_debater', 'Desert Logic',      'Hot takes from a hot climate.',                        'pk_dummy_a1b2c3d4e5f60004', 2480, 25, 9,  'dubai',     ARRAY['Religion','Politics'],  true,  false, 520,  'Asia'),
  ('dummy_a1b2c3d4e5f60005', '@goldstandard',  'Gold Standard',     'Austrian economics or bust.',                           'pk_dummy_a1b2c3d4e5f60005', 2350, 22, 11, 'goldstd',   ARRAY['Economics'],            false, false, 410,  'Europe'),
  ('dummy_a1b2c3d4e5f60006', '@codeslinger',   'Code Slinger',      'AI will debate us all eventually. I practice early.',   'pk_dummy_a1b2c3d4e5f60006', 2210, 28, 14, 'code',      ARRAY['Technology','Science'], false, true,  380,  'Asia'),
  ('dummy_a1b2c3d4e5f60007', '@pampas_talker', 'Pampas Talker',     'Argentine fire. Tangos with words.',                    'pk_dummy_a1b2c3d4e5f60007', 1980, 18, 10, 'pampas',    ARRAY['Politics','Culture'],   false, false, 290,  'South America'),
  ('dummy_a1b2c3d4e5f60008', '@sahara_wisdom', 'Sahara Wisdom',     'Ancient debates, modern medium.',                       'pk_dummy_a1b2c3d4e5f60008', 1840, 15, 8,  'sahara',    ARRAY['Philosophy','History'], true,  false, 240,  'Africa'),
  ('dummy_a1b2c3d4e5f60009', '@outback_orator','Outback Orator',    'No filter, no fear, no surrender.',                     'pk_dummy_a1b2c3d4e5f60009', 1620, 12, 9,  'outback',   ARRAY['Sports','Culture'],     false, false, 180,  'Oceania'),
  ('dummy_a1b2c3d4e5f60010', '@midwest_logic', 'Midwest Logic',     'Common sense is uncommon. I bring it back.',            'pk_dummy_a1b2c3d4e5f60010', 1450, 10, 7,  'midwest',   ARRAY['Politics','Economics'], false, false, 150,  'North America'),
  ('dummy_a1b2c3d4e5f60011', '@berlin_bauer',  'Berlin Bauer',      'Kantian ethics applied to internet arguments.',        'pk_dummy_a1b2c3d4e5f60011', 1310, 8,  6,  'berlin',    ARRAY['Philosophy','Law'],     false, false, 120,  'Europe'),
  ('dummy_a1b2c3d4e5f60012', '@rookie_rabbit', 'Rookie Rabbit',     'New to the floor. Hungry to learn.',                    'pk_dummy_a1b2c3d4e5f60012', 1080, 3,  5,  'rookie',    ARRAY['Culture'],              false, false, 45,   'Oceania')
ON CONFLICT (id) DO UPDATE SET
  handle = EXCLUDED.handle,
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  elo = EXCLUDED.elo,
  debates_won = EXCLUDED.debates_won,
  debates_lost = EXCLUDED.debates_lost,
  categories = EXCLUDED.categories,
  is_verified = EXCLUDED.is_verified,
  is_live = EXCLUDED.is_live,
  follower_count = EXCLUDED.follower_count,
  region = EXCLUDED.region,
  updated_at = now();
