-- Include these at the end of rest/, after it's complete

-- *** ADD BEFORE DROPPING AUTH COLUMNS
-- Keep old users-auth on-hand temporarily. Will delete afte some weeks
insert into auth_old (id, email, hashed_password, updated_at)
    select id, email, hashed_password, updated_at from users;

-- *** ADD AT THE END OF MIGRATION

-- Add sort ot tags
with tags_ as (
  select id,
    row_number() over (partition by user_id order by created_at asc) rank
  from tags
)
update tags set sort=tags_.rank from tags_ where tags.id=tags_.id;

-- add ai to tags
update tags set ai_index=true, ai_summarize=true;

-- add n_notes to entries
update entries e set n_notes=(select count(*) from notes where entry_id=e.id);

-- TODO finish Shares migration
