-- noinspection SqlNoDataSourceInspectionForFile

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create table users
(
	id uuid not null
		constraint users_pkey
			primary key,
	email varchar not null,
	hashed_password varchar not null,
	is_active boolean not null,
	is_superuser boolean not null,
	created_at timestamp with time zone default now(),
	updated_at timestamp with time zone default now(),
	first_name varchar,
	last_name varchar,
	gender varchar,
	orientation varchar,
	birthday date,
	timezone varchar,
	bio varchar,
	is_cool boolean default false,
	therapist boolean default false,
	ai_ran boolean default false,
	last_books timestamp with time zone default now(),
	last_influencers timestamp with time zone default now(),
	habitica_user_id varchar,
	habitica_api_token varchar,
	paid boolean,
	is_verified boolean default true
);

create type defaultvaluetypes as enum ('value', 'average', 'ffill');

create type fieldtype as enum ('number', 'fivestar', 'check', 'option');

create type machinetypes as enum ('gpu', 'server');

create type notetypes as enum ('label', 'note', 'resource');

create type shelves as enum ('ai', 'cosine', 'like', 'already_read', 'dislike', 'remove', 'recommend');

create table books
(
	id serial
		constraint books_pkey
			primary key,
	title varchar not null,
	text varchar not null,
	author varchar,
	topic varchar,
	thumbs integer default 0,
	amazon varchar
);

create table jobs
(
	id uuid default uuid_generate_v4() not null
		constraint jobs_pkey
			primary key,
	created_at timestamp with time zone default now(),
	updated_at timestamp with time zone default now(),
	method varchar not null,
	state varchar default 'new'::character varying,
	run_on machinetypes default 'gpu'::machinetypes,
	machine_id varchar,
	data_in jsonb,
	data_out jsonb
);

create index ix_jobs_created_at
	on jobs (created_at);

create index ix_jobs_machine_id
	on jobs (machine_id);

create index ix_jobs_method
	on jobs (method);

create index ix_jobs_run_on
	on jobs (run_on);

create index ix_jobs_state
	on jobs (state);

create index ix_jobs_updated_at
	on jobs (updated_at);

create table machines
(
	id varchar not null
		constraint machines_pkey
			primary key,
	status varchar,
	created_at timestamp with time zone default now(),
	updated_at timestamp with time zone default now()
);

create index ix_machines_created_at
	on machines (created_at);

create index ix_machines_updated_at
	on machines (updated_at);



create table ws_connections (
  connection_id varchar not null,
  user_id uuid not null
    constraint ws_connections_user_id_fkey references users on delete cascade,
  constraint ws_connections_pkey primary key (connection_id, user_id)
);

create table bookshelf
(
	created_at timestamp with time zone default now(),
	updated_at timestamp with time zone default now(),
	book_id integer not null,
	user_id uuid not null
		constraint bookshelf_user_id_fkey
			references users
				on delete cascade,
	shelf shelves not null,
	score double precision,
	constraint bookshelf_pkey
		primary key (book_id, user_id)
);

create index ix_bookshelf_created_at
	on bookshelf (created_at);

create index ix_bookshelf_updated_at
	on bookshelf (updated_at);

create table cache_users
(
	user_id uuid not null
		constraint cache_users_pkey
			primary key
		constraint cache_users_user_id_fkey
			references users
				on delete cascade,
	paras character varying[],
	clean character varying[],
	vectors double precision[]
);

create table entries
(
	id uuid default uuid_generate_v4() not null
		constraint entries_pkey
			primary key,
	created_at timestamp with time zone default now(),
	updated_at timestamp with time zone default now(),
	title varchar,
	text varchar not null,
	no_ai boolean default false,
	ai_ran boolean default false,
	title_summary varchar,
	text_summary varchar,
	sentiment varchar,
	user_id uuid
		constraint entries_user_id_fkey
			references users
				on delete cascade
);

create table cache_entries
(
	entry_id uuid not null
		constraint cache_entries_pkey
			primary key
		constraint cache_entries_entry_id_fkey
			references entries
				on delete cascade,
	paras character varying[],
	clean character varying[],
	vectors double precision[]
);

create index ix_entries_created_at
	on entries (created_at);

create index ix_entries_updated_at
	on entries (updated_at);

create index ix_entries_user_id
	on entries (user_id);

create table fields
(
	id uuid default uuid_generate_v4() not null
		constraint fields_pkey
			primary key,
	type fieldtype,
	name varchar,
	created_at timestamp with time zone default now(),
	excluded_at timestamp with time zone default now(),
	default_value defaultvaluetypes default 'value'::defaultvaluetypes,
	default_value_value double precision,
	attributes json,
	service varchar,
	service_id varchar,
	user_id uuid
		constraint fields_user_id_fkey
			references users
				on delete cascade,
	influencer_score double precision default '0'::double precision,
	next_pred double precision default '0'::double precision,
	avg double precision default '0'::double precision
);

create table field_entries
(
	id uuid default uuid_generate_v4() not null
		constraint field_entries_pkey
			primary key,
	value double precision,
	created_at timestamp with time zone default now(),
	user_id uuid
		constraint field_entries_user_id_fkey
			references users
				on delete cascade,
	field_id uuid
		constraint field_entries_field_id_fkey
			references fields
				on delete cascade
);

create index ix_field_entries_created_at
	on field_entries (created_at);

create index ix_field_entries_user_id
	on field_entries (user_id);

create index ix_fields_created_at
	on fields (created_at);

create index ix_fields_excluded_at
	on fields (excluded_at);

create index ix_fields_user_id
	on fields (user_id);

create table influencers
(
	field_id uuid not null
		constraint influencers_field_id_fkey
			references fields
				on delete cascade,
	influencer_id uuid not null
		constraint influencers_influencer_id_fkey
			references fields
				on delete cascade,
	score double precision not null,
	constraint influencers_pkey
		primary key (field_id, influencer_id)
);

create table notes
(
	id uuid default uuid_generate_v4() not null
		constraint notes_pkey
			primary key,
	created_at timestamp with time zone default now(),
	entry_id uuid
		constraint notes_entry_id_fkey
			references entries
				on delete cascade,
	user_id uuid
		constraint notes_user_id_fkey
			references users
				on delete cascade,
	type notetypes not null,
	text varchar not null,
	private boolean default false
);

create index ix_notes_created_at
	on notes (created_at);

create index ix_notes_entry_id
	on notes (entry_id);

create index ix_notes_user_id
	on notes (user_id);

create table people
(
	id uuid default uuid_generate_v4() not null
		constraint people_pkey
			primary key,
	name varchar,
	relation varchar,
	issues varchar,
	bio varchar,
	user_id uuid
		constraint people_user_id_fkey
			references users
				on delete cascade
);

create index ix_people_user_id
	on people (user_id);

create table profile_matches
(
	user_id uuid not null
		constraint profile_matches_user_id_fkey
			references users
				on delete cascade,
	match_id uuid not null
		constraint profile_matches_match_id_fkey
			references users
				on delete cascade,
	score double precision not null,
	constraint profile_matches_pkey
		primary key (user_id, match_id)
);

create table shares
(
	id uuid default uuid_generate_v4() not null
		constraint shares_pkey
			primary key,
	user_id uuid
		constraint shares_user_id_fkey
			references users
				on delete cascade,
	email varchar(255),
	fields boolean,
	books boolean,
	profile boolean,
	last_seen timestamp with time zone default now(),
	new_entries integer default 0
);

create index ix_shares_email
	on shares (email);

create index ix_shares_last_seen
	on shares (last_seen);

create index ix_shares_user_id
	on shares (user_id);

create table tags
(
	id uuid default uuid_generate_v4() not null
		constraint tags_pkey
			primary key,
	user_id uuid
		constraint tags_user_id_fkey
			references users
				on delete cascade,
	name varchar not null,
	created_at timestamp with time zone default now(),
	selected boolean default true,
	main boolean default false
);

create table entries_tags
(
	entry_id uuid not null
		constraint entries_tags_entry_id_fkey
			references entries
				on delete cascade,
	tag_id uuid not null
		constraint entries_tags_tag_id_fkey
			references tags
				on delete cascade,
	constraint entries_tags_pkey
		primary key (entry_id, tag_id)
);

create table shares_tags
(
	share_id uuid not null
		constraint shares_tags_share_id_fkey
			references shares
				on delete cascade,
	tag_id uuid not null
		constraint shares_tags_tag_id_fkey
			references tags
				on delete cascade,
	selected boolean default true,
	constraint shares_tags_pkey
		primary key (share_id, tag_id)
);

create index ix_tags_created_at
	on tags (created_at);

create index ix_tags_user_id
	on tags (user_id);

create index ix_users_created_at
	on users (created_at);

create unique index ix_users_email
	on users (email);

create index ix_users_last_books
	on users (last_books);

create index ix_users_last_influencers
	on users (last_influencers);

create index ix_users_updated_at
	on users (updated_at);

create table field_entries2
(
	field_id uuid not null
		constraint field_entries2_field_id_fkey
			references fields
				on delete cascade,
	day date not null,
	created_at timestamp with time zone default now(),
	value double precision,
	user_id uuid
		constraint field_entries2_user_id_fkey
			references users
				on delete cascade,
	dupes jsonb,
	dupe integer default 0,
	constraint field_entries2_pkey
		primary key (field_id, day)
);

create index ix_field_entries2_day
	on field_entries2 (day);

create index ix_field_entries2_field_id
	on field_entries2 (field_id);

create index ix_field_entries2_user_id
	on field_entries2 (user_id);

create index ix_field_entries2_created_at
	on field_entries2 (created_at);

create table model_hypers
(
	id uuid default uuid_generate_v4() not null
		constraint model_hypers_pkey
			primary key,
	model varchar not null,
	model_version integer not null,
	user_id uuid
		constraint model_hypers_user_id_fkey
			references users
				on delete cascade,
	created_at timestamp with time zone default now(),
	score double precision not null,
	hypers jsonb not null,
	meta jsonb
);

create index ix_model_hypers_model_version
	on model_hypers (model_version);

create index ix_model_hypers_created_at
	on model_hypers (created_at);

create index ix_model_hypers_model
	on model_hypers (model);
