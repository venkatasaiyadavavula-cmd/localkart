-- Reproduces production 500 on GET /seller/earnings and GET /admin/commissions/summary
-- Error: operator does not exist: uuid = text
-- Run: psql -d your_db -f scripts/repro-settlement-query-error.sql

-- BROKEN (current production until deploy of 6f99e3c6):
SELECT COALESCE(SUM(o."totalAmount" - o."commissionAmount"), 0)
FROM orders o
WHERE o.status = 'delivered'
  AND o.id NOT IN (
    SELECT DISTINCT jsonb_array_elements_text(t.metadata->'orderIds')
    FROM transactions t
    WHERE t.type = 'settlement'
      AND t.metadata->'orderIds' IS NOT NULL
  );

-- FIXED:
SELECT COALESCE(SUM(o."totalAmount" - o."commissionAmount"), 0)
FROM orders o
WHERE o.status = 'delivered'
  AND NOT EXISTS (
    SELECT 1
    FROM transactions st
    CROSS JOIN LATERAL jsonb_array_elements_text(
      CASE
        WHEN jsonb_typeof(st.metadata->'orderIds') = 'array'
        THEN st.metadata->'orderIds'
        ELSE '[]'::jsonb
      END
    ) AS settled(order_id)
    WHERE st.type = 'settlement'
      AND settled.order_id = o.id::text
  );
