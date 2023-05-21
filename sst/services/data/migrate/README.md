v0 of Gnothi's database was handled via SQLAlchemy, and is so technologically different that I can't migrate systematically. Instead, I introspected prod to generate a first migraiton, then went through some cleanup steps to generate the rest of the migrations. What follows is how I did so, just for my own reference (in case I need to do it again). You as a user won't follow these steps, instead skip to part 2.

## 1: Generate the initial migration scripts 

1. Dump DDL from prod, use as reference ti cross-check drizzle's results. `PGPASSWORD='password' pg_dump --no-owner --no-acl -s -h host -U user -d prod > prod-ddl.sql`.
1. Generate first migration (schema setup) from the same. `npx drizzle-kit introspect:pg --out=services/data/migrate/first --host=host --port=5432 --user=user --password=password --database=prod --ssl`
1. The generated schema was imperfect, so I manually cleaned up the `schema.ts` and copied it to `servicse/data/migrate/v0/schema.ts`. Now, instead of the above, `first/` schema will be generated via `npx drizzle-kit generate:pg --out services/data/migrate/first --schema services/data/migrate/v0/schema.ts`.
1. Copy `first/` to `rest/` via `cp -r services/data/migrate/first services/data/migrate/rest`. Reason is that the "real" migration from v0 prod DB to the new system will be skipping the `first/` migration. That will be used only for new-machine setups (localhost). The prod database will come in wholesale, structure and data, and so won't need the `first/` migration. 
2. For the same reason, we need to clear out the SQL file from the first migration in `rest/`. So `echo "" > services/data/migrate/rest/0000_<FILENAME>.sql`
3. Now, for the whole point of `rest/` - bring the DB structure up-to-date by generating a migration. `npx drizzle-kit migrate:pg --out services/data/migrate/rest --schema services/data/schemas`. 
4. There are some errors in the generated migration. Look out for `"varchar[]"` (remove the quotes). I'll update here if others come up.  

## 2. Run the migration scripts (as a developer / user)
The migration can't be run on localhost, but instead is a lambda function. Find that function ARN in the CLI output, then run it with:

1. `aws lambda invoke --function-name <FUNCTION ARN> /dev/null`

TODO: this doesn't work yet, I need to have a method for running `first/` and then running `rest/`. This is handled in my live migration script (next section); the migration lambda needs to account for `first/` (including creating the database itself). It currently only runs `rest/`.


## 2. Run the migration scripts (as Tyler, the live Gnothi v0 -> v1 migration)
Skip this - this is for Tyler's notes-to-self. 

1. Create a `services/data/migrate/v0/.env.<STAGE>` file
1. Change the `--stage` in `package.json#scripts#v0:migrate`
1. Double check constants, etc `services/data/migrate/v0/migrate.spec.ts`
1. Delete any users in user-pool
1. Connect the ClientVPN (allow script to connect to RDS)
1. Run `npm run v0:migrate`
1. When finished, change `stacks/Auth` to require email verification for users
