-- Production test-data reset — deletes marketplace data; keeps admin users and reference tables.
-- Run via scripts/prod-reset-test-data.sh (backup + CONFIRM gate). Wrapped in a single transaction.

BEGIN;

-- --- Leaf / charge rows ---
DELETE FROM review_helpful_votes;
DELETE FROM ad_campaign_charges;
DELETE FROM video_upload_charges;

-- --- Product-attached content ---
DELETE FROM reviews;
DELETE FROM product_likes;
DELETE FROM wishlists;
DELETE FROM product_variants;
DELETE FROM featured_videos;
DELETE FROM daily_offers;
DELETE FROM sponsored_products;

-- --- Order graph (children before parents) ---
DELETE FROM return_requests;
DELETE FROM order_items;
DELETE FROM transactions;
DELETE FROM orders;

-- --- Shop-attached billing & staff ---
DELETE FROM commission_bills;
DELETE FROM subscriptions;
DELETE FROM staff_members;

-- --- Catalog & shops ---
DELETE FROM products;
DELETE FROM shops;

-- --- Customer-only user data ---
DELETE FROM saved_addresses;

-- --- Seller & customer accounts (never admin) ---
DELETE FROM users WHERE role IN ('customer', 'seller');

COMMIT;
