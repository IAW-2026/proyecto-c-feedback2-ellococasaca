-- Reseñas mock para la cuenta seller de prueba "sellertest".
-- Seller (Clerk sub real, no sintetico): user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex
-- Productos: los 7 productId reales que tiene ese seller en la Seller App.
-- Buyers: reutiliza clerkIds sinteticos ya presentes en seeds/02-buyerapp.sql
-- (mas el buyer canonico de demo) para mantener consistencia con el mock general.
--
-- Independiente de prisma/mock-feedback.sql para no perderse si se regenera
-- ese archivo con seeds/generate-seeds.mjs. Idempotente via ON CONFLICT.
--
-- Run with:
--   npx prisma db execute --file prisma/seed-sellertest-reviews.sql

-- ─── ReviewEligibility ──────────────────────────────────────────────────────
-- Consumidas por las reviews de abajo (enabled = false).

INSERT INTO "ReviewEligibility" ("id","orderId","shipmentId","buyerId","sellerId","productIds","deliveredAt","enabled","createdAt")
VALUES
  ('elig_sellertest_001','ord_ext_sellertest_001','ship_sellertest_001','user_seed_b003xxDEMO0003','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex',ARRAY['14ec80e4-7635-4384-8dc6-38781fc0a81f'],'2026-06-02 14:00:00+00',FALSE,'2026-06-02 14:00:00+00'),
  ('elig_sellertest_002','ord_ext_sellertest_002','ship_sellertest_002','user_seed_b011xxDEMO0011','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex',ARRAY['14ec80e4-7635-4384-8dc6-38781fc0a81f'],'2026-06-04 10:30:00+00',FALSE,'2026-06-04 10:30:00+00'),
  ('elig_sellertest_003','ord_ext_sellertest_003','ship_sellertest_003','user_seed_b017xxDEMO0017','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex',ARRAY['14ec80e4-7635-4384-8dc6-38781fc0a81f'],'2026-06-05 09:15:00+00',FALSE,'2026-06-05 09:15:00+00'),
  ('elig_sellertest_004','ord_ext_sellertest_004','ship_sellertest_004','user_3EZ24f4ckNuGNicwvUv60v16df5','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex',ARRAY['36053ffd-b1a2-4294-bead-458e25a311a2'],'2026-06-07 16:45:00+00',FALSE,'2026-06-07 16:45:00+00'),
  ('elig_sellertest_005','ord_ext_sellertest_005','ship_sellertest_005','user_seed_b007xxDEMO0007','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex',ARRAY['3d8b6287-42a2-4031-8617-ae3427575c09'],'2026-06-09 11:00:00+00',FALSE,'2026-06-09 11:00:00+00'),
  ('elig_sellertest_006','ord_ext_sellertest_006','ship_sellertest_006','user_seed_b015xxDEMO0015','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex',ARRAY['3d8b6287-42a2-4031-8617-ae3427575c09'],'2026-06-11 13:20:00+00',FALSE,'2026-06-11 13:20:00+00'),
  ('elig_sellertest_007','ord_ext_sellertest_007','ship_sellertest_007','user_seed_b019xxDEMO0019','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex',ARRAY['54d54059-cb50-43d3-9218-b0487afd12f4'],'2026-06-13 17:40:00+00',FALSE,'2026-06-13 17:40:00+00'),
  ('elig_sellertest_008','ord_ext_sellertest_008','ship_sellertest_008','user_seed_b021xxDEMO0021','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex',ARRAY['55eca653-51b2-4df1-9280-33b35e200421'],'2026-06-15 08:50:00+00',FALSE,'2026-06-15 08:50:00+00'),
  ('elig_sellertest_009','ord_ext_sellertest_009','ship_sellertest_009','user_seed_b024xxDEMO0024','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex',ARRAY['55eca653-51b2-4df1-9280-33b35e200421'],'2026-06-17 12:10:00+00',FALSE,'2026-06-17 12:10:00+00'),
  ('elig_sellertest_010','ord_ext_sellertest_010','ship_sellertest_010','user_seed_b009xxDEMO0009','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex',ARRAY['5abe655b-8ffb-4b93-82b8-246bec9ee5b9'],'2026-06-19 15:30:00+00',FALSE,'2026-06-19 15:30:00+00'),
  ('elig_sellertest_011','ord_ext_sellertest_011','ship_sellertest_011','user_seed_b002xxDEMO0002','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex',ARRAY['e45a54ad-cad1-4274-b68d-32775a9eb072'],'2026-06-21 09:05:00+00',FALSE,'2026-06-21 09:05:00+00')
ON CONFLICT ("orderId") DO UPDATE SET
  "buyerId"    = EXCLUDED."buyerId",
  "sellerId"   = EXCLUDED."sellerId",
  "productIds" = EXCLUDED."productIds",
  "deliveredAt"= EXCLUDED."deliveredAt",
  "enabled"    = EXCLUDED."enabled";

-- ─── Reviews ────────────────────────────────────────────────────────────────
-- 10 publicadas con rating variado + 1 oculta por moderación (para probar
-- tambien la cola del moderador sobre este seller).

INSERT INTO "Review" ("id","orderId","buyerId","sellerId","productId","ratingProduct","comment","status","isModerated","moderationReason","createdAt","updatedAt")
VALUES
  ('rev_sellertest_001','ord_ext_sellertest_001',
   'user_seed_b003xxDEMO0003','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex','14ec80e4-7635-4384-8dc6-38781fc0a81f',
   5,'Excelente producto, la calidad superó lo que esperaba. Llegó rápido y bien embalado.',
   'PUBLISHED',FALSE,
   'Moderacion automatica (local): APPROVED. Score local: 0. Indicadores: sin indicadores locales.',
   '2026-06-02 18:20:00+00','2026-06-02 18:20:00+00'),

  ('rev_sellertest_002','ord_ext_sellertest_002',
   'user_seed_b011xxDEMO0011','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex','14ec80e4-7635-4384-8dc6-38781fc0a81f',
   4,'Buena calidad y tal como en las fotos. Tardó un par de días más de lo estimado.',
   'PUBLISHED',FALSE,
   'Moderacion automatica (local): APPROVED. Score local: 0. Indicadores: sin indicadores locales.',
   '2026-06-05 09:10:00+00','2026-06-05 09:10:00+00'),

  ('rev_sellertest_003','ord_ext_sellertest_003',
   'user_seed_b017xxDEMO0017','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex','14ec80e4-7635-4384-8dc6-38781fc0a81f',
   1,'Contenido inapropiado ocultado por moderación.',
   'HIDDEN',TRUE,
   'Moderacion automatica (local): REJECTED. Score local: 82. Indicadores: ofensivo, lenguaje inapropiado.',
   '2026-06-05 20:00:00+00','2026-06-06 08:00:00+00'),

  ('rev_sellertest_004','ord_ext_sellertest_004',
   'user_3EZ24f4ckNuGNicwvUv60v16df5','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex','36053ffd-b1a2-4294-bead-458e25a311a2',
   5,'Todo perfecto, el vendedor respondió rápido mis dudas antes de comprar. Muy recomendable.',
   'PUBLISHED',FALSE,
   'Moderacion automatica (local): APPROVED. Score local: 0. Indicadores: sin indicadores locales.',
   '2026-06-08 12:00:00+00','2026-06-08 12:00:00+00'),

  ('rev_sellertest_005','ord_ext_sellertest_005',
   'user_seed_b007xxDEMO0007','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex','3d8b6287-42a2-4031-8617-ae3427575c09',
   4,'Buen producto, cumple lo que promete. El empaque podría mejorar un poco.',
   'PUBLISHED',FALSE,
   'Moderacion automatica (local): APPROVED. Score local: 0. Indicadores: sin indicadores locales.',
   '2026-06-10 10:00:00+00','2026-06-10 10:00:00+00'),

  ('rev_sellertest_006','ord_ext_sellertest_006',
   'user_seed_b015xxDEMO0015','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex','3d8b6287-42a2-4031-8617-ae3427575c09',
   3,'Está bien pero esperaba mejor terminación por el precio. Cumple, sin más.',
   'PUBLISHED',FALSE,
   'Moderacion automatica (local): APPROVED. Score local: 0. Indicadores: sin indicadores locales.',
   '2026-06-12 15:45:00+00','2026-06-12 15:45:00+00'),

  ('rev_sellertest_007','ord_ext_sellertest_007',
   'user_seed_b019xxDEMO0019','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex','54d54059-cb50-43d3-9218-b0487afd12f4',
   5,'Llegó antes de lo esperado y en perfectas condiciones. Muy conforme con la compra.',
   'PUBLISHED',FALSE,
   'Moderacion automatica (local): APPROVED. Score local: 0. Indicadores: sin indicadores locales.',
   '2026-06-14 09:30:00+00','2026-06-14 09:30:00+00'),

  ('rev_sellertest_008','ord_ext_sellertest_008',
   'user_seed_b021xxDEMO0021','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex','55eca653-51b2-4df1-9280-33b35e200421',
   2,'El producto llegó con detalles de fabricación y demoró bastante el envío.',
   'PUBLISHED',FALSE,
   'Moderacion automatica (local): APPROVED. Score local: 0. Indicadores: sin indicadores locales.',
   '2026-06-16 11:15:00+00','2026-06-16 11:15:00+00'),

  ('rev_sellertest_009','ord_ext_sellertest_009',
   'user_seed_b024xxDEMO0024','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex','55eca653-51b2-4df1-9280-33b35e200421',
   5,'Excelente relación calidad-precio, ya es la segunda vez que le compro a este vendedor.',
   'PUBLISHED',FALSE,
   'Moderacion automatica (local): APPROVED. Score local: 0. Indicadores: sin indicadores locales.',
   '2026-06-18 14:00:00+00','2026-06-18 14:00:00+00'),

  ('rev_sellertest_010','ord_ext_sellertest_010',
   'user_seed_b009xxDEMO0009','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex','5abe655b-8ffb-4b93-82b8-246bec9ee5b9',
   4,'Buena atención y el producto tal cual se describía. Volvería a comprar.',
   'PUBLISHED',FALSE,
   'Moderacion automatica (local): APPROVED. Score local: 0. Indicadores: sin indicadores locales.',
   '2026-06-20 16:20:00+00','2026-06-20 16:20:00+00'),

  ('rev_sellertest_011','ord_ext_sellertest_011',
   'user_seed_b002xxDEMO0002','user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex','e45a54ad-cad1-4274-b68d-32775a9eb072',
   5,'Impecable de principio a fin, envío rápido y producto de muy buena calidad.',
   'PUBLISHED',FALSE,
   'Moderacion automatica (local): APPROVED. Score local: 0. Indicadores: sin indicadores locales.',
   '2026-06-22 10:40:00+00','2026-06-22 10:40:00+00')

ON CONFLICT ("orderId") DO UPDATE SET
  "ratingProduct"    = EXCLUDED."ratingProduct",
  "comment"          = EXCLUDED."comment",
  "status"           = EXCLUDED."status",
  "isModerated"      = EXCLUDED."isModerated",
  "moderationReason" = EXCLUDED."moderationReason",
  "updatedAt"        = NOW();

-- ─── ReviewReport ───────────────────────────────────────────────────────────
-- Reporte sobre la review oculta, para que tambien aparezca en /feedback/moderator.

INSERT INTO "ReviewReport" ("id","reviewId","reporterId","reason","status","createdAt")
VALUES
  ('report_sellertest_001','rev_sellertest_003',
   'user_3EY16ziKMUxsmaAXntfuJajRpIR',
   'Contenido ofensivo detectado por moderación automática.',
   'OPEN','2026-06-06 08:05:00+00')
ON CONFLICT ("id") DO UPDATE SET
  "reason" = EXCLUDED."reason",
  "status" = EXCLUDED."status";

-- ─── RatingsCache ───────────────────────────────────────────────────────────
-- Calculado a mano replicando lib/ratings-cache.ts: promedio de ratingProduct
-- solo entre reviews PUBLISHED por producto, y para el seller el promedio de
-- esos promedios por producto (no ponderado por cantidad de reviews).

INSERT INTO "RatingsCache" ("targetId","targetType","averageRating","totalReviews")
VALUES
  ('14ec80e4-7635-4384-8dc6-38781fc0a81f','PRODUCT', 4.5, 2),
  ('36053ffd-b1a2-4294-bead-458e25a311a2','PRODUCT', 5.0, 1),
  ('3d8b6287-42a2-4031-8617-ae3427575c09','PRODUCT', 3.5, 2),
  ('54d54059-cb50-43d3-9218-b0487afd12f4','PRODUCT', 5.0, 1),
  ('55eca653-51b2-4df1-9280-33b35e200421','PRODUCT', 3.5, 2),
  ('5abe655b-8ffb-4b93-82b8-246bec9ee5b9','PRODUCT', 4.0, 1),
  ('e45a54ad-cad1-4274-b68d-32775a9eb072','PRODUCT', 5.0, 1),
  ('user_3Fb3eo0vx1JwFX9FAzcCKY9R9ex','SELLER', 4.357142857142857, 10)
ON CONFLICT ("targetId","targetType") DO UPDATE SET
  "averageRating" = EXCLUDED."averageRating",
  "totalReviews"  = EXCLUDED."totalReviews";
