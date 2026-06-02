-- Mock seed for Feedback App
-- Replace the IDs below with real Clerk IDs used in your local tests.

-- 1) Eligible delivered order so the buyer can create a review from /feedback/buyer.
INSERT INTO "ReviewEligibility" (
  "id",
  "orderId",
  "shipmentId",
  "buyerId",
  "sellerId",
  "productIds",
  "deliveredAt",
  "enabled",
  "createdAt"
)
VALUES (
  'elig_mock_order_001',
  'order_mock_001',
  'ship_mock_001',
  'user_3EY16ziKMUxsmaAXntfuJajRpIR',
  'user_3EY1BlufGgMT4Sbl0VIjABwoIUe',
  ARRAY['product_mock_001'],
  NOW(),
  TRUE,
  NOW()
)
ON CONFLICT ("orderId") DO UPDATE SET
  "buyerId" = EXCLUDED."buyerId",
  "sellerId" = EXCLUDED."sellerId",
  "productIds" = EXCLUDED."productIds",
  "deliveredAt" = EXCLUDED."deliveredAt",
  "enabled" = EXCLUDED."enabled";

-- 2) Optional existing review so seller/admin can verify listing immediately.
INSERT INTO "Review" (
  "id",
  "orderId",
  "buyerId",
  "sellerId",
  "productId",
  "ratingProduct",
  "ratingSeller",
  "comment",
  "status",
  "isModerated",
  "createdAt",
  "updatedAt"
)
VALUES (
  'rev_mock_order_002',
  'order_mock_002',
  'user_3EY16ziKMUxsmaAXntfuJajRpIR',
  'user_3EY1BlufGgMT4Sbl0VIjABwoIUe',
  'product_mock_002',
  4,
  5,
  'Mock review inserted from SQL seed for cross-role testing.',
  'PUBLISHED',
  FALSE,
  NOW(),
  NOW()
)
ON CONFLICT ("orderId") DO UPDATE SET
  "buyerId" = EXCLUDED."buyerId",
  "sellerId" = EXCLUDED."sellerId",
  "productId" = EXCLUDED."productId",
  "ratingProduct" = EXCLUDED."ratingProduct",
  "ratingSeller" = EXCLUDED."ratingSeller",
  "comment" = EXCLUDED."comment",
  "status" = EXCLUDED."status",
  "isModerated" = EXCLUDED."isModerated",
  "updatedAt" = NOW();