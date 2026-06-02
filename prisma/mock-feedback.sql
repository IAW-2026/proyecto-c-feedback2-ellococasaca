-- Mock seed for Feedback App — El Loco Casaca
-- Clerk user IDs must match real users created in your Clerk dashboard.
--
-- Roles expected:
--   buyer    → buyer.feedback@example.com
--   seller   → seller.feedback@example.com
--   moderator→ moderator.feedback@example.com
--   admin    → admin.feedback@example.com
--
-- Replace the placeholder IDs below with the real Clerk IDs once you have them.
-- Run with:  npm run seed:mock

-- ─── ReviewEligibility ────────────────────────────────────────────────────────
-- Enables the buyer to create a review for each of these orders.

INSERT INTO "ReviewEligibility" ("id","orderId","shipmentId","buyerId","sellerId","productIds","deliveredAt","enabled","createdAt")
VALUES
  ('elig_001','order_001','ship_001',
   'user_3EZ24f4ckNuGNicwvUv60v16df5','user_3EZ21jRpTuRcgSfKa94ytFJM1Eq',
   ARRAY['product_001','product_002'],NOW(),TRUE,NOW()),

  ('elig_002','order_002','ship_002',
   'user_3EZ24f4ckNuGNicwvUv60v16df5','user_3EZ21jRpTuRcgSfKa94ytFJM1Eq',
   ARRAY['product_003'],NOW(),TRUE,NOW()),

  ('elig_003','order_003','ship_003',
   'user_3EZ24f4ckNuGNicwvUv60v16df5','user_3EZ21jRpTuRcgSfKa94ytFJM1Eq',
   ARRAY['product_001'],NOW() - INTERVAL '5 days',TRUE,NOW() - INTERVAL '5 days')
ON CONFLICT ("orderId") DO UPDATE SET
  "buyerId"    = EXCLUDED."buyerId",
  "sellerId"   = EXCLUDED."sellerId",
  "productIds" = EXCLUDED."productIds",
  "deliveredAt"= EXCLUDED."deliveredAt",
  "enabled"    = EXCLUDED."enabled";

-- ─── Reviews ──────────────────────────────────────────────────────────────────
-- Variety of statuses so every role has data to work with immediately.

INSERT INTO "Review" ("id","orderId","buyerId","sellerId","productId","ratingProduct","ratingSeller","comment","status","isModerated","createdAt","updatedAt")
VALUES
  -- PUBLISHED, not moderated
  ('rev_001','order_004',
   'user_3EZ24f4ckNuGNicwvUv60v16df5','user_3EZ21jRpTuRcgSfKa94ytFJM1Eq','product_001',
   5,5,
   'Excelente camiseta, llegó perfecta y en tiempo. El vendedor fue muy atento.',
   'PUBLISHED',FALSE,NOW() - INTERVAL '10 days',NOW() - INTERVAL '10 days'),

  -- PUBLISHED, not moderated
  ('rev_002','order_005',
   'user_3EZ24f4ckNuGNicwvUv60v16df5','user_3EZ21jRpTuRcgSfKa94ytFJM1Eq','product_002',
   4,4,
   'Muy buena calidad, fiel a las fotos. Demoró un poco más de lo esperado pero llegó bien.',
   'PUBLISHED',FALSE,NOW() - INTERVAL '7 days',NOW() - INTERVAL '7 days'),

  -- PUBLISHED, moderated (was reviewed by moderator)
  ('rev_003','order_006',
   'user_3EZ24f4ckNuGNicwvUv60v16df5','user_3EZ21jRpTuRcgSfKa94ytFJM1Eq','product_003',
   3,4,
   'La camiseta era buena pero el talle no coincidía con la descripción.',
   'PUBLISHED',TRUE,NOW() - INTERVAL '5 days',NOW() - INTERVAL '3 days'),

  -- HIDDEN por moderación
  ('rev_004','order_007',
   'user_3EZ24f4ckNuGNicwvUv60v16df5','user_3EZ21jRpTuRcgSfKa94ytFJM1Eq','product_001',
   1,1,
   'Contenido inapropiado ocultado por moderación.',
   'HIDDEN',TRUE,NOW() - INTERVAL '4 days',NOW() - INTERVAL '2 days'),

  -- PUBLISHED, rating bajo — genera variedad en el promedio
  ('rev_005','order_008',
   'user_3EZ24f4ckNuGNicwvUv60v16df5','user_3EZ21jRpTuRcgSfKa94ytFJM1Eq','product_002',
   2,3,
   'El bordado estaba mal hecho y el color no era el mismo que en las fotos.',
   'PUBLISHED',FALSE,NOW() - INTERVAL '2 days',NOW() - INTERVAL '2 days')

ON CONFLICT ("orderId") DO UPDATE SET
  "ratingProduct" = EXCLUDED."ratingProduct",
  "ratingSeller"  = EXCLUDED."ratingSeller",
  "comment"       = EXCLUDED."comment",
  "status"        = EXCLUDED."status",
  "isModerated"   = EXCLUDED."isModerated",
  "updatedAt"     = NOW();

-- ─── ReviewReports ────────────────────────────────────────────────────────────
-- Open reports so the moderator page shows real data immediately.

INSERT INTO "ReviewReport" ("id","reviewId","reporterId","reason","status","createdAt")
VALUES
  ('report_001','rev_004',
   'user_3EY16ziKMUxsmaAXntfuJajRpIR',
   'El comentario contiene lenguaje ofensivo y datos personales.',
   'OPEN',NOW() - INTERVAL '3 days'),

  ('report_002','rev_005',
   'user_3EY1BlufGgMT4Sbl0VIjABwoIUe',
   'La reseña describe un producto diferente al que fue comprado.',
   'OPEN',NOW() - INTERVAL '1 day'),

  -- Reporte ya resuelto — para mostrar historial
  ('report_003','rev_003',
   'user_3EY16ziKMUxsmaAXntfuJajRpIR',
   'Posible reseña falsa.',
   'RESOLVED',NOW() - INTERVAL '4 days')

ON CONFLICT ("id") DO UPDATE SET
  "reason" = EXCLUDED."reason",
  "status" = EXCLUDED."status";

-- ─── RatingsCache ─────────────────────────────────────────────────────────────
-- Pre-calculated averages so GET /api/product-ratings and /api/seller-ratings
-- respond from cache without recalculating.

INSERT INTO "RatingsCache" ("targetId","targetType","averageRating","totalReviews")
VALUES
  ('product_001','PRODUCT', 3.0, 2),
  ('product_002','PRODUCT', 3.0, 2),
  ('product_003','PRODUCT', 3.0, 1),
  ('user_3EY1BlufGgMT4Sbl0VIjABwoIUe','SELLER', 3.4, 5)
ON CONFLICT ("targetId","targetType") DO UPDATE SET
  "averageRating" = EXCLUDED."averageRating",
  "totalReviews"  = EXCLUDED."totalReviews";