First run migrate_js(step=init_db) to init the DB structure

Then run migrate_py (call it directly from migrate_js) to download the old DB, decrypt the columns, and insert directly into new DB

Then call migrate_js(step=trigger_ml)

Later, delete this folder. This is only useful for the oldSite -> newSite one-time migration.
