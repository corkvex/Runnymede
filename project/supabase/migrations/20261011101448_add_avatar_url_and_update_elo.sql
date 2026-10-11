/* Add avatar_url column and update dummy creators with avatars + new Elo ranges */

ALTER TABLE public_profiles ADD COLUMN IF NOT EXISTS avatar_url text;

UPDATE public_profiles SET avatar_url = '/avatar_socrates.webp'    WHERE id = 'dummy_a1b2c3d4e5f60001';
UPDATE public_profiles SET avatar_url = '/avatar_newton.webp'      WHERE id = 'dummy_a1b2c3d4e5f60002';
UPDATE public_profiles SET avatar_url = '/avatar_nightowl.webp'    WHERE id = 'dummy_a1b2c3d4e5f60003';
UPDATE public_profiles SET avatar_url = '/avatar_dubai.webp'       WHERE id = 'dummy_a1b2c3d4e5f60004';
UPDATE public_profiles SET avatar_url = '/avatar_goldstandard.webp' WHERE id = 'dummy_a1b2c3d4e5f60005';
UPDATE public_profiles SET avatar_url = '/avatar_codeslinger.webp' WHERE id = 'dummy_a1b2c3d4e5f60006';
UPDATE public_profiles SET avatar_url = '/avatar_pampas.webp'      WHERE id = 'dummy_a1b2c3d4e5f60007';
UPDATE public_profiles SET avatar_url = '/avatar_sahara.webp'      WHERE id = 'dummy_a1b2c3d4e5f60008';
UPDATE public_profiles SET avatar_url = '/avatar_outback.webp'     WHERE id = 'dummy_a1b2c3d4e5f60009';
UPDATE public_profiles SET avatar_url = '/avatar_midwest.webp'     WHERE id = 'dummy_a1b2c3d4e5f60010';
UPDATE public_profiles SET avatar_url = '/avatar_berlin.webp'      WHERE id = 'dummy_a1b2c3d4e5f60011';
UPDATE public_profiles SET avatar_url = '/avatar_rookie.webp'      WHERE id = 'dummy_a1b2c3d4e5f60012';

/* Update Elo values to span the new tier ranges:
   Novice 0-1199, Intermediate 1200-1599, Advanced 1600-1999,
   Expert 2000-2199, Master 2200-2499, Grandmaster 2500+ */
UPDATE public_profiles SET elo = 2850 WHERE id = 'dummy_a1b2c3d4e5f60001'; -- Grandmaster
UPDATE public_profiles SET elo = 2720 WHERE id = 'dummy_a1b2c3d4e5f60002'; -- Grandmaster
UPDATE public_profiles SET elo = 2610 WHERE id = 'dummy_a1b2c3d4e5f60003'; -- Grandmaster
UPDATE public_profiles SET elo = 2540 WHERE id = 'dummy_a1b2c3d4e5f60004'; -- Grandmaster
UPDATE public_profiles SET elo = 2380 WHERE id = 'dummy_a1b2c3d4e5f60005'; -- Master
UPDATE public_profiles SET elo = 2250 WHERE id = 'dummy_a1b2c3d4e5f60006'; -- Master
UPDATE public_profiles SET elo = 2100 WHERE id = 'dummy_a1b2c3d4e5f60007'; -- Expert
UPDATE public_profiles SET elo = 2050 WHERE id = 'dummy_a1b2c3d4e5f60008'; -- Expert
UPDATE public_profiles SET elo = 1850 WHERE id = 'dummy_a1b2c3d4e5f60009'; -- Advanced
UPDATE public_profiles SET elo = 1700 WHERE id = 'dummy_a1b2c3d4e5f60010'; -- Advanced
UPDATE public_profiles SET elo = 1450 WHERE id = 'dummy_a1b2c3d4e5f60011'; -- Intermediate
UPDATE public_profiles SET elo = 1080 WHERE id = 'dummy_a1b2c3d4e5f60012'; -- Novice
