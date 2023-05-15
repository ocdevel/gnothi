--
-- PostgreSQL database dump
--

-- Dumped from database version 11.17
-- Dumped by pg_dump version 15.2 (Debian 15.2-1.pgdg110+1)
--
-- SET statement_timeout = 0;
-- SET lock_timeout = 0;
-- SET idle_in_transaction_session_timeout = 0;
-- SET client_encoding = 'UTF8';
-- SET standard_conforming_strings = on;
-- SELECT pg_catalog.set_config('search_path', '', false);
-- SET check_function_bodies = false;
-- SET xmloption = content;
-- SET client_min_messages = warning;
-- SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: defaultvaluetypes; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE defaultvaluetypes AS ENUM (
    'value',
    'average',
    'ffill'
);


--
-- Name: fieldtype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE fieldtype AS ENUM (
    'number',
    'fivestar',
    'check',
    'option'
);


--
-- Name: machinetypes; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE machinetypes AS ENUM (
    'gpu',
    'server'
);


--
-- Name: notetypes; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE notetypes AS ENUM (
    'label',
    'note',
    'resource'
);


--
-- Name: shelves; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE shelves AS ENUM (
    'ai',
    'cosine',
    'like',
    'already_read',
    'dislike',
    'remove',
    'recommend'
);


SET default_tablespace = '';

--
-- Name: books; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE books (
    id integer NOT NULL,
    title character varying NOT NULL,
    text character varying NOT NULL,
    author character varying,
    topic character varying,
    thumbs integer DEFAULT 0,
    amazon character varying
);


--
-- Name: books_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE books_id_seq OWNED BY books.id;


--
-- Name: bookshelf; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE bookshelf (
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    book_id integer NOT NULL,
    user_id uuid NOT NULL,
    shelf shelves NOT NULL,
    score double precision
);


--
-- Name: cache_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE cache_entries (
    entry_id uuid NOT NULL,
    paras character varying[],
    clean character varying[],
    vectors double precision[]
);


--
-- Name: cache_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE cache_users (
    user_id uuid NOT NULL,
    paras character varying[],
    clean character varying[],
    vectors double precision[]
);


--
-- Name: entries; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: entries_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE entries_tags (
    entry_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: field_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE field_entries (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    value double precision,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    field_id uuid
);


--
-- Name: field_entries2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE field_entries2 (
    field_id uuid NOT NULL,
    day date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    value double precision,
    user_id uuid,
    dupes jsonb,
    dupe integer DEFAULT 0
);


--
-- Name: fields; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: influencers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE influencers (
    field_id uuid NOT NULL,
    influencer_id uuid NOT NULL,
    score double precision NOT NULL
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: machines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE machines (
    id character varying NOT NULL,
    status character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: model_hypers; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE notes (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    entry_id uuid,
    user_id uuid,
    type notetypes NOT NULL,
    text character varying NOT NULL,
    private boolean DEFAULT false
);


--
-- Name: people; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE people (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying,
    relation character varying,
    issues character varying,
    bio character varying,
    user_id uuid
);


--
-- Name: profile_matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE profile_matches (
    user_id uuid NOT NULL,
    match_id uuid NOT NULL,
    score double precision NOT NULL
);


--
-- Name: shares; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: shares_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE shares_tags (
    share_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    selected boolean DEFAULT true
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE tags (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid,
    name character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    selected boolean DEFAULT true,
    main boolean DEFAULT false
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

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
    is_verified boolean DEFAULT true
);


--
-- Name: books id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY books ALTER COLUMN id SET DEFAULT nextval('books_id_seq'::regclass);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: bookshelf bookshelf_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY bookshelf
    ADD CONSTRAINT bookshelf_pkey PRIMARY KEY (book_id, user_id);


--
-- Name: cache_entries cache_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY cache_entries
    ADD CONSTRAINT cache_entries_pkey PRIMARY KEY (entry_id);


--
-- Name: cache_users cache_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY cache_users
    ADD CONSTRAINT cache_users_pkey PRIMARY KEY (user_id);


--
-- Name: entries entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY entries
    ADD CONSTRAINT entries_pkey PRIMARY KEY (id);


--
-- Name: entries_tags entries_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY entries_tags
    ADD CONSTRAINT entries_tags_pkey PRIMARY KEY (entry_id, tag_id);


--
-- Name: field_entries2 field_entries2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY field_entries2
    ADD CONSTRAINT field_entries2_pkey PRIMARY KEY (field_id, day);


--
-- Name: field_entries field_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY field_entries
    ADD CONSTRAINT field_entries_pkey PRIMARY KEY (id);


--
-- Name: fields fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY fields
    ADD CONSTRAINT fields_pkey PRIMARY KEY (id);


--
-- Name: influencers influencers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY influencers
    ADD CONSTRAINT influencers_pkey PRIMARY KEY (field_id, influencer_id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: machines machines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY machines
    ADD CONSTRAINT machines_pkey PRIMARY KEY (id);


--
-- Name: model_hypers model_hypers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY model_hypers
    ADD CONSTRAINT model_hypers_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: people people_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY people
    ADD CONSTRAINT people_pkey PRIMARY KEY (id);


--
-- Name: profile_matches profile_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY profile_matches
    ADD CONSTRAINT profile_matches_pkey PRIMARY KEY (user_id, match_id);


--
-- Name: shares shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY shares
    ADD CONSTRAINT shares_pkey PRIMARY KEY (id);


--
-- Name: shares_tags shares_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY shares_tags
    ADD CONSTRAINT shares_tags_pkey PRIMARY KEY (share_id, tag_id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_bookshelf_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bookshelf_created_at ON bookshelf USING btree (created_at);


--
-- Name: ix_bookshelf_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bookshelf_updated_at ON bookshelf USING btree (updated_at);


--
-- Name: ix_entries_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_entries_created_at ON entries USING btree (created_at);


--
-- Name: ix_entries_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_entries_updated_at ON entries USING btree (updated_at);


--
-- Name: ix_entries_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_entries_user_id ON entries USING btree (user_id);


--
-- Name: ix_field_entries2_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_field_entries2_created_at ON field_entries2 USING btree (created_at);


--
-- Name: ix_field_entries2_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_field_entries2_day ON field_entries2 USING btree (day);


--
-- Name: ix_field_entries2_field_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_field_entries2_field_id ON field_entries2 USING btree (field_id);


--
-- Name: ix_field_entries2_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_field_entries2_user_id ON field_entries2 USING btree (user_id);


--
-- Name: ix_field_entries_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_field_entries_created_at ON field_entries USING btree (created_at);


--
-- Name: ix_field_entries_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_field_entries_user_id ON field_entries USING btree (user_id);


--
-- Name: ix_fields_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_fields_created_at ON fields USING btree (created_at);


--
-- Name: ix_fields_excluded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_fields_excluded_at ON fields USING btree (excluded_at);


--
-- Name: ix_fields_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_fields_user_id ON fields USING btree (user_id);


--
-- Name: ix_jobs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_jobs_created_at ON jobs USING btree (created_at);


--
-- Name: ix_jobs_machine_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_jobs_machine_id ON jobs USING btree (machine_id);


--
-- Name: ix_jobs_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_jobs_method ON jobs USING btree (method);


--
-- Name: ix_jobs_run_on; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_jobs_run_on ON jobs USING btree (run_on);


--
-- Name: ix_jobs_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_jobs_state ON jobs USING btree (state);


--
-- Name: ix_jobs_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_jobs_updated_at ON jobs USING btree (updated_at);


--
-- Name: ix_machines_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_machines_created_at ON machines USING btree (created_at);


--
-- Name: ix_machines_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_machines_updated_at ON machines USING btree (updated_at);


--
-- Name: ix_model_hypers_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_model_hypers_created_at ON model_hypers USING btree (created_at);


--
-- Name: ix_model_hypers_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_model_hypers_model ON model_hypers USING btree (model);


--
-- Name: ix_model_hypers_model_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_model_hypers_model_version ON model_hypers USING btree (model_version);


--
-- Name: ix_notes_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notes_created_at ON notes USING btree (created_at);


--
-- Name: ix_notes_entry_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notes_entry_id ON notes USING btree (entry_id);


--
-- Name: ix_notes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notes_user_id ON notes USING btree (user_id);


--
-- Name: ix_people_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_people_user_id ON people USING btree (user_id);


--
-- Name: ix_shares_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shares_email ON shares USING btree (email);


--
-- Name: ix_shares_last_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shares_last_seen ON shares USING btree (last_seen);


--
-- Name: ix_shares_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shares_user_id ON shares USING btree (user_id);


--
-- Name: ix_tags_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_tags_created_at ON tags USING btree (created_at);


--
-- Name: ix_tags_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_tags_user_id ON tags USING btree (user_id);


--
-- Name: ix_users_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_created_at ON users USING btree (created_at);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_email ON users USING btree (email);


--
-- Name: ix_users_last_books; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_last_books ON users USING btree (last_books);


--
-- Name: ix_users_last_influencers; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_last_influencers ON users USING btree (last_influencers);


--
-- Name: ix_users_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_updated_at ON users USING btree (updated_at);


--
-- Name: bookshelf bookshelf_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY bookshelf
    ADD CONSTRAINT bookshelf_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: cache_entries cache_entries_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY cache_entries
    ADD CONSTRAINT cache_entries_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE;


--
-- Name: cache_users cache_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY cache_users
    ADD CONSTRAINT cache_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: entries_tags entries_tags_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY entries_tags
    ADD CONSTRAINT entries_tags_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE;


--
-- Name: entries_tags entries_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY entries_tags
    ADD CONSTRAINT entries_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;


--
-- Name: entries entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY entries
    ADD CONSTRAINT entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: field_entries2 field_entries2_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY field_entries2
    ADD CONSTRAINT field_entries2_field_id_fkey FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE;


--
-- Name: field_entries2 field_entries2_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY field_entries2
    ADD CONSTRAINT field_entries2_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: field_entries field_entries_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY field_entries
    ADD CONSTRAINT field_entries_field_id_fkey FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE;


--
-- Name: field_entries field_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY field_entries
    ADD CONSTRAINT field_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: fields fields_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY fields
    ADD CONSTRAINT fields_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: influencers influencers_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY influencers
    ADD CONSTRAINT influencers_field_id_fkey FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE;


--
-- Name: influencers influencers_influencer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY influencers
    ADD CONSTRAINT influencers_influencer_id_fkey FOREIGN KEY (influencer_id) REFERENCES fields(id) ON DELETE CASCADE;


--
-- Name: model_hypers model_hypers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY model_hypers
    ADD CONSTRAINT model_hypers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: notes notes_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY notes
    ADD CONSTRAINT notes_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE;


--
-- Name: notes notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: people people_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY people
    ADD CONSTRAINT people_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: profile_matches profile_matches_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY profile_matches
    ADD CONSTRAINT profile_matches_match_id_fkey FOREIGN KEY (match_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: profile_matches profile_matches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY profile_matches
    ADD CONSTRAINT profile_matches_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: shares_tags shares_tags_share_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY shares_tags
    ADD CONSTRAINT shares_tags_share_id_fkey FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE CASCADE;


--
-- Name: shares_tags shares_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY shares_tags
    ADD CONSTRAINT shares_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;


--
-- Name: shares shares_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY shares
    ADD CONSTRAINT shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: tags tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY tags
    ADD CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

