ALTER TABLE "ws_connections" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();
CREATE INDEX IF NOT EXISTS "ix_ws_connections_connection_id" ON "ws_connections" ("connection_id");
CREATE INDEX IF NOT EXISTS "ix_ws_connections_created_at" ON "ws_connections" ("created_at");
update "ws_connections" set created_at = now() where true;
