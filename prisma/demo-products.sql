BEGIN;

INSERT INTO "Product" (pname, price, quantity)
SELECT 'X', 100000.00, 10
WHERE NOT EXISTS (
  SELECT 1 FROM "Product" WHERE pname = 'X'
);

INSERT INTO "Product" (pname, price, quantity)
SELECT 'Y', 200000.00, 20
WHERE NOT EXISTS (
  SELECT 1 FROM "Product" WHERE pname = 'Y'
);

COMMIT;