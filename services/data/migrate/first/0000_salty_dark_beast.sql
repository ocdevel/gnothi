CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
CREATE TYPE defaultvaluetypes AS ENUM (
    'value',
    'average',
    'ffill'
);
CREATE TYPE fieldtype AS ENUM (
    'number',
    'fivestar',
    'check',
    'option'
);
CREATE TYPE machinetypes AS ENUM (
    'gpu',
    'server'
);
CREATE TYPE notetypes AS ENUM (
    'label',
    'note',
    'resource'
);
CREATE TYPE shelves AS ENUM (
    'ai',
    'cosine',
    'like',
    'already_read',
    'dislike',
    'remove',
    'recommend'
);
CREATE TABLE books (
    id integer NOT NULL,
    title character varying NOT NULL,
    text character varying NOT NULL,
    author character varying,
    topic character varying,
    thumbs integer DEFAULT 0,
    amazon character varying
);
CREATE SEQUENCE books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE books_id_seq OWNED BY books.id;
CREATE TABLE bookshelf (
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    book_id integer NOT NULL,
    user_id uuid NOT NULL,
    shelf shelves NOT NULL,
    score double precision
);
CREATE TABLE cache_entries (
    entry_id uuid NOT NULL,
    paras character varying[],
    clean character varying[],
    vectors double precision[]
);
CREATE TABLE cache_users (
    user_id uuid NOT NULL,
    paras character varying[],
    clean character varying[],
    vectors double precision[]
);
CREATE TABLE entries (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    title character varying,
    text character varying NOT NULL,
    no_ai boolean DEFAULT false,
    ai_ran boolean DEFAULT false,
    title_summary character varying,
    text_summary character varying,
    sentiment character varying,
    user_id uuid
);
CREATE TABLE entries_tags (
    entry_id uuid NOT NULL,
    tag_id uuid NOT NULL
);
CREATE TABLE field_entries (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    value double precision,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    field_id uuid
);
CREATE TABLE field_entries2 (
    field_id uuid NOT NULL,
    day date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    value double precision,
    user_id uuid,
    dupes jsonb,
    dupe integer DEFAULT 0
);
CREATE TABLE fields (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    type fieldtype,
    name character varying,
    created_at timestamp with time zone DEFAULT now(),
    excluded_at timestamp with time zone DEFAULT now(),
    default_value defaultvaluetypes DEFAULT 'value'::defaultvaluetypes,
    default_value_value double precision,
    attributes json,
    service character varying,
    service_id character varying,
    user_id uuid,
    influencer_score double precision DEFAULT '0'::double precision,
    next_pred double precision DEFAULT '0'::double precision,
    avg double precision DEFAULT '0'::double precision
);
CREATE TABLE influencers (
    field_id uuid NOT NULL,
    influencer_id uuid NOT NULL,
    score double precision NOT NULL
);
CREATE TABLE jobs (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    method character varying NOT NULL,
    state character varying DEFAULT 'new'::character varying,
    run_on machinetypes DEFAULT 'gpu'::machinetypes,
    machine_id character varying,
    data_in jsonb,
    data_out jsonb
);
CREATE TABLE machines (
    id character varying NOT NULL,
    status character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE model_hypers (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    model character varying NOT NULL,
    model_version integer NOT NULL,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    score double precision NOT NULL,
    hypers jsonb NOT NULL,
    meta jsonb
);
CREATE TABLE notes (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    entry_id uuid,
    user_id uuid,
    type notetypes NOT NULL,
    text character varying NOT NULL,
    private boolean DEFAULT false
);
CREATE TABLE people (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying,
    relation character varying,
    issues character varying,
    bio character varying,
    user_id uuid
);
CREATE TABLE profile_matches (
    user_id uuid NOT NULL,
    match_id uuid NOT NULL,
    score double precision NOT NULL
);
CREATE TABLE shares (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid,
    email character varying(255),
    fields boolean,
    books boolean,
    profile boolean,
    last_seen timestamp with time zone DEFAULT now(),
    new_entries integer DEFAULT 0
);
CREATE TABLE shares_tags (
    share_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    selected boolean DEFAULT true
);
CREATE TABLE tags (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid,
    name character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    selected boolean DEFAULT true,
    main boolean DEFAULT false
);
CREATE TABLE users (
    id uuid NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    is_active boolean NOT NULL,
    is_superuser boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    first_name character varying,
    last_name character varying,
    gender character varying,
    orientation character varying,
    birthday date,
    timezone character varying,
    bio character varying,
    is_cool boolean DEFAULT false,
    therapist boolean DEFAULT false,
    ai_ran boolean DEFAULT false,
    last_books timestamp with time zone DEFAULT now(),
    last_influencers timestamp with time zone DEFAULT now(),
    habitica_user_id character varying,
    habitica_api_token character varying,
    paid boolean,
    is_verified boolean DEFAULT true,
    cognito_id character varying
);
ALTER TABLE ONLY books ALTER COLUMN id SET DEFAULT nextval('books_id_seq'::regclass);
ALTER TABLE ONLY books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);
ALTER TABLE ONLY bookshelf
    ADD CONSTRAINT bookshelf_pkey PRIMARY KEY (book_id, user_id);
ALTER TABLE ONLY cache_entries
    ADD CONSTRAINT cache_entries_pkey PRIMARY KEY (entry_id);
ALTER TABLE ONLY cache_users
    ADD CONSTRAINT cache_users_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY entries
    ADD CONSTRAINT entries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY entries_tags
    ADD CONSTRAINT entries_tags_pkey PRIMARY KEY (entry_id, tag_id);
ALTER TABLE ONLY field_entries2
    ADD CONSTRAINT field_entries2_pkey PRIMARY KEY (field_id, day);
ALTER TABLE ONLY field_entries
    ADD CONSTRAINT field_entries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY fields
    ADD CONSTRAINT fields_pkey PRIMARY KEY (id);
ALTER TABLE ONLY influencers
    ADD CONSTRAINT influencers_pkey PRIMARY KEY (field_id, influencer_id);
ALTER TABLE ONLY jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY machines
    ADD CONSTRAINT machines_pkey PRIMARY KEY (id);
ALTER TABLE ONLY model_hypers
    ADD CONSTRAINT model_hypers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY people
    ADD CONSTRAINT people_pkey PRIMARY KEY (id);
ALTER TABLE ONLY profile_matches
    ADD CONSTRAINT profile_matches_pkey PRIMARY KEY (user_id, match_id);
ALTER TABLE ONLY shares
    ADD CONSTRAINT shares_pkey PRIMARY KEY (id);
ALTER TABLE ONLY shares_tags
    ADD CONSTRAINT shares_tags_pkey PRIMARY KEY (share_id, tag_id);
ALTER TABLE ONLY tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
CREATE INDEX ix_bookshelf_created_at ON bookshelf USING btree (created_at);
CREATE INDEX ix_bookshelf_updated_at ON bookshelf USING btree (updated_at);
CREATE INDEX ix_entries_created_at ON entries USING btree (created_at);
CREATE INDEX ix_entries_updated_at ON entries USING btree (updated_at);
CREATE INDEX ix_entries_user_id ON entries USING btree (user_id);
CREATE INDEX ix_field_entries2_created_at ON field_entries2 USING btree (created_at);
CREATE INDEX ix_field_entries2_day ON field_entries2 USING btree (day);
CREATE INDEX ix_field_entries2_field_id ON field_entries2 USING btree (field_id);
CREATE INDEX ix_field_entries2_user_id ON field_entries2 USING btree (user_id);
CREATE INDEX ix_field_entries_created_at ON field_entries USING btree (created_at);
CREATE INDEX ix_field_entries_user_id ON field_entries USING btree (user_id);
CREATE INDEX ix_fields_created_at ON fields USING btree (created_at);
CREATE INDEX ix_fields_excluded_at ON fields USING btree (excluded_at);
CREATE INDEX ix_fields_user_id ON fields USING btree (user_id);
CREATE INDEX ix_jobs_created_at ON jobs USING btree (created_at);
CREATE INDEX ix_jobs_machine_id ON jobs USING btree (machine_id);
CREATE INDEX ix_jobs_method ON jobs USING btree (method);
CREATE INDEX ix_jobs_run_on ON jobs USING btree (run_on);
CREATE INDEX ix_jobs_state ON jobs USING btree (state);
CREATE INDEX ix_jobs_updated_at ON jobs USING btree (updated_at);
CREATE INDEX ix_machines_created_at ON machines USING btree (created_at);
CREATE INDEX ix_machines_updated_at ON machines USING btree (updated_at);
CREATE INDEX ix_model_hypers_created_at ON model_hypers USING btree (created_at);
CREATE INDEX ix_model_hypers_model ON model_hypers USING btree (model);
CREATE INDEX ix_model_hypers_model_version ON model_hypers USING btree (model_version);
CREATE INDEX ix_notes_created_at ON notes USING btree (created_at);
CREATE INDEX ix_notes_entry_id ON notes USING btree (entry_id);
CREATE INDEX ix_notes_user_id ON notes USING btree (user_id);
CREATE INDEX ix_people_user_id ON people USING btree (user_id);
CREATE INDEX ix_shares_email ON shares USING btree (email);
CREATE INDEX ix_shares_last_seen ON shares USING btree (last_seen);
CREATE INDEX ix_shares_user_id ON shares USING btree (user_id);
CREATE INDEX ix_tags_created_at ON tags USING btree (created_at);
CREATE INDEX ix_tags_user_id ON tags USING btree (user_id);
CREATE INDEX ix_users_cognito_id ON users USING btree (cognito_id);
CREATE INDEX ix_users_created_at ON users USING btree (created_at);
CREATE UNIQUE INDEX ix_users_email ON users USING btree (email);
CREATE INDEX ix_users_last_books ON users USING btree (last_books);
CREATE INDEX ix_users_last_influencers ON users USING btree (last_influencers);
CREATE INDEX ix_users_updated_at ON users USING btree (updated_at);
ALTER TABLE ONLY bookshelf
    ADD CONSTRAINT bookshelf_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cache_entries
    ADD CONSTRAINT cache_entries_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE;
ALTER TABLE ONLY cache_users
    ADD CONSTRAINT cache_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY entries_tags
    ADD CONSTRAINT entries_tags_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE;
ALTER TABLE ONLY entries_tags
    ADD CONSTRAINT entries_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;
ALTER TABLE ONLY entries
    ADD CONSTRAINT entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY field_entries2
    ADD CONSTRAINT field_entries2_field_id_fkey FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE;
ALTER TABLE ONLY field_entries2
    ADD CONSTRAINT field_entries2_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY field_entries
    ADD CONSTRAINT field_entries_field_id_fkey FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE;
ALTER TABLE ONLY field_entries
    ADD CONSTRAINT field_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY fields
    ADD CONSTRAINT fields_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY influencers
    ADD CONSTRAINT influencers_field_id_fkey FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE;
ALTER TABLE ONLY influencers
    ADD CONSTRAINT influencers_influencer_id_fkey FOREIGN KEY (influencer_id) REFERENCES fields(id) ON DELETE CASCADE;
ALTER TABLE ONLY model_hypers
    ADD CONSTRAINT model_hypers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY notes
    ADD CONSTRAINT notes_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE;
ALTER TABLE ONLY notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY people
    ADD CONSTRAINT people_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY profile_matches
    ADD CONSTRAINT profile_matches_match_id_fkey FOREIGN KEY (match_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY profile_matches
    ADD CONSTRAINT profile_matches_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY shares_tags
    ADD CONSTRAINT shares_tags_share_id_fkey FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE CASCADE;
ALTER TABLE ONLY shares_tags
    ADD CONSTRAINT shares_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;
ALTER TABLE ONLY shares
    ADD CONSTRAINT shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY tags
    ADD CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
