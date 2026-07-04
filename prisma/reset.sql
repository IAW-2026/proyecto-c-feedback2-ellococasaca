-- Borra todas las tablas en orden (respeta FK) y reinicia secuencias.
-- Usar siempre antes de seed:mock para partir de cero.
TRUNCATE TABLE "ReviewReport", "Review", "ReviewEligibility", "RatingsCache" CASCADE;
