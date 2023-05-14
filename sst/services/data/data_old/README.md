Need to start with old database in order to transform / migrate it to new schema.
* prod-ddl.sql generated from `PGPASSWORD='password' pg_dump --no-owner --no-acl -s -h host.rds.amazonaws.com -U user -d prod > prod-ddl.sql`
* drizzle/ generated from ` node ../node_modules/drizzle-kit/index.js introspect:pg --out=data/migrations_old/ --host=host.rds.amazonaws.com --port=5432 --user=user --password='password' --database=prod`

Ideally they'd match up, but it's not exact. drizzle/ is needed for drizzle-kit to generate the migration.  
