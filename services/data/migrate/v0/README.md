One-time migrator from old site to new. 

1. Install postgres locally, need for `psql` command: `sudo apt-get install -y postgresql-client`
1. Fill out `.env.(local|staging|prod)`, use `.env` as example.
1. From `/services`, `npm run v0:migrate`. This will run `sst bind vitest <migrate.spec.ts>`.  That's why migrate is a `.spec`, it piggy-backs off SST's bind feature with vitest, to get vars.
