-- Constraints the Prisma schema language can't express — dev-docs/implementation.md, Step 1.3.

-- Singleton
ALTER TABLE "settings" ADD CONSTRAINT settings_singleton CHECK ("id" = 1);

-- Order code sequence
CREATE SEQUENCE order_code_seq START 1000;

-- Quantity
ALTER TABLE "menu_day_items" ADD CONSTRAINT mdi_quantity_valid
  CHECK ("quantityAvailable" >= 0 AND "quantityOrdered" >= 0
         AND "quantityOrdered" <= "quantityAvailable");
ALTER TABLE "order_items" ADD CONSTRAINT oi_quantity_positive CHECK ("quantity" > 0);

-- Capacity
ALTER TABLE "menu_days" ADD CONSTRAINT md_capacity_valid
  CHECK ("maxOrders" > 0 AND "overbookLimit" >= "maxOrders");
ALTER TABLE "settings" ADD CONSTRAINT s_fulfilment_enabled
  CHECK ("pickupEnabled" = true OR "deliveryEnabled" = true);

-- Customers
ALTER TABLE "customers" ADD CONSTRAINT c_trust_exclusive
  CHECK (NOT ("isTrusted" = true AND "isBlocked" = true));
ALTER TABLE "customers" ADD CONSTRAINT c_phone_e164
  CHECK ("phoneE164" ~ '^\+[1-9][0-9]{7,14}$');

-- Orders
ALTER TABLE "orders" ADD CONSTRAINT o_total_adds_up
  CHECK ("totalPaise" = "subtotalPaise" + "deliveryFeePaise");
ALTER TABLE "orders" ADD CONSTRAINT o_delivery_has_address
  CHECK ("fulfilmentType" <> 'DELIVERY'
         OR ("deliveryAddress" IS NOT NULL AND length(trim("deliveryAddress")) > 0));
ALTER TABLE "orders" ADD CONSTRAINT o_verified_has_timestamp
  CHECK ("status" NOT IN ('VERIFIED','READY','COMPLETED') OR "verifiedAt" IS NOT NULL);

-- Order code is immutable: it gets read aloud on the phone and written on a bag
CREATE OR REPLACE FUNCTION prevent_code_change() RETURNS TRIGGER AS $$
BEGIN
  IF OLD."code" IS DISTINCT FROM NEW."code" THEN
    RAISE EXCEPTION 'Order code is immutable (% -> %)', OLD."code", NEW."code";
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER orders_code_immutable BEFORE UPDATE ON "orders"
  FOR EACH ROW EXECUTE FUNCTION prevent_code_change();

-- Partial indexes for the hot queries
CREATE INDEX orders_pending_idx ON "orders" ("fulfilmentDate", "createdAt")
  WHERE "status" = 'PENDING';
CREATE INDEX orders_active_idx ON "orders" ("fulfilmentDate", "pickupTime")
  WHERE "status" IN ('VERIFIED','READY');
CREATE INDEX orders_capacity_idx ON "orders" ("menuDayId", "status")
  WHERE "status" NOT IN ('CANCELLED','NO_SHOW');

-- Partial phone/name search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX customers_phone_trgm ON "customers" USING gin ("phoneE164" gin_trgm_ops);
CREATE INDEX customers_name_trgm  ON "customers" USING gin (lower("name") gin_trgm_ops);
CREATE INDEX menu_items_name_trgm ON "menu_items" USING gin (lower("name") gin_trgm_ops);
