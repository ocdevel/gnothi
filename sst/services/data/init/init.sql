-- noinspection SqlNoDataSourceInspectionForFile

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create type notetypes as enum ('label', 'note', 'resource', 'comment');

create type fieldtype as enum ('number', 'fivestar', 'check', 'option');

create type defaultvaluetypes as enum ('value', 'average', 'ffill');

create type shelves as enum ('ai', 'cosine', 'like', 'already_read', 'dislike', 'remove', 'recommend');

create type groupprivacy as enum ('public', 'matchable', 'private');

create type grouproles as enum ('member', 'owner', 'admin', 'banned');

create table users
(
    id uuid default uuid_generate_v4() not null primary key,
    email varchar(320) not null,
    cognito_id varchar,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    username varchar,
    first_name varchar,
    last_name varchar,
    gender varchar,
    orientation varchar,
    birthday date,
    timezone varchar,
    bio varchar,
    is_superuser boolean default false,
    is_cool boolean default false,
    therapist boolean default false,
    n_tokens integer default 0,
    affiliate varchar,
    ai_ran boolean default false,
    last_books timestamp with time zone,
    last_influencers timestamp with time zone,
    habitica_user_id varchar,
    habitica_api_token varchar
);

create index ix_users_last_books
    on users (last_books);

create index ix_users_last_influencers
    on users (last_influencers);

create unique index ix_users_cognito_id
    on users (cognito_id);

create index ix_users_created_at
    on users (created_at);

create index ix_users_updated_at
    on users (updated_at);

create unique index ix_users_username
    on users (username);

create unique index ix_users_email
    on users (email);

create table books
(
    id     serial
        primary key,
    title  varchar not null,
    text   varchar not null,
    author varchar,
    topic  varchar,
    thumbs integer default 0,
    amazon varchar
);

create table misc
(
    key varchar not null
        primary key,
    val varchar
);

create table codes
(
    owner_id uuid
        references users
            on delete cascade,
    code     varchar not null
        primary key,
    amount   double precision default '0'::double precision
);

alter table users
    add foreign key (affiliate) references codes;

create index ix_codes_owner_id
    on codes (owner_id);

create table auth_old
(
    id              uuid         not null
        primary key
        references users
            on delete cascade,
    email           varchar(320) not null,
    hashed_password varchar(72)  not null,
    updated_at      timestamp with time zone default now()
);

create unique index ix_auth_old_email
    on auth_old (email);

create index ix_auth_old_updated_at
    on auth_old (updated_at);

create index ix_auth_old_id
    on auth_old (id);

create table entries
(
    id            uuid                     default uuid_generate_v4() not null
        primary key,
    created_at    timestamp with time zone default now(),
    updated_at    timestamp with time zone default now(),
    n_notes       integer                  default 0,
    title         varchar,
    text          varchar                                             not null,
    no_ai         boolean                  default false,
    ai_ran        boolean                  default false,
    title_summary varchar,
    text_summary  varchar,
    sentiment     varchar,
    user_id       uuid
        references users
            on delete cascade
);

create index ix_entries_user_id
    on entries (user_id);

create index ix_entries_created_at
    on entries (created_at);

create index ix_entries_updated_at
    on entries (updated_at);

create table fields
(
    id                  uuid                     default uuid_generate_v4() not null
        primary key,
    type                fieldtype,
    name                varchar,
    created_at          timestamp with time zone default now(),
    excluded_at         timestamp with time zone,
    default_value       defaultvaluetypes        default 'value'::defaultvaluetypes,
    default_value_value double precision,
    attributes          json,
    service             varchar,
    service_id          varchar,
    user_id             uuid
        references users
            on delete cascade,
    influencer_score    double precision         default '0'::double precision,
    next_pred           double precision         default '0'::double precision,
    avg                 double precision         default '0'::double precision
);

create index ix_fields_excluded_at
    on fields (excluded_at);

create index ix_fields_user_id
    on fields (user_id);

create index ix_fields_created_at
    on fields (created_at);

create table people
(
    id       uuid default uuid_generate_v4() not null
        primary key,
    name     varchar,
    relation varchar,
    issues   varchar,
    bio      varchar,
    user_id  uuid
        references users
            on delete cascade
);

create index ix_people_user_id
    on people (user_id);

create table shares
(
    id          uuid                     default uuid_generate_v4() not null
        primary key,
    user_id     uuid
        references users
            on delete cascade,
    created_at  timestamp with time zone default now(),
    email       boolean                  default false,
    username    boolean                  default true,
    first_name  boolean                  default false,
    last_name   boolean                  default false,
    gender      boolean                  default false,
    orientation boolean                  default false,
    birthday    boolean                  default false,
    timezone    boolean                  default false,
    bio         boolean                  default false,
    people      boolean                  default false,
    fields      boolean                  default false,
    books       boolean                  default false
);

create index ix_shares_user_id
    on shares (user_id);

create index ix_shares_created_at
    on shares (created_at);

create table tags
(
    id         uuid                     default uuid_generate_v4() not null
        primary key,
    user_id    uuid
        references users
            on delete cascade,
    name       varchar                                             not null,
    created_at timestamp with time zone default now(),
    selected   boolean                  default true,
    main       boolean                  default false,
    sort       integer                  default 0                  not null,
    ai         boolean                  default true
);

create index ix_tags_user_id
    on tags (user_id);

create index ix_tags_created_at
    on tags (created_at);

create table bookshelf
(
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    book_id    integer not null,
    user_id    uuid    not null
        references users
            on delete cascade,
    shelf      shelves not null,
    score      double precision,
    primary key (book_id, user_id)
);

create index ix_bookshelf_created_at
    on bookshelf (created_at);

create index ix_bookshelf_updated_at
    on bookshelf (updated_at);


create table model_hypers
(
    id            uuid                     default uuid_generate_v4() not null
        primary key,
    model         varchar                                             not null,
    model_version integer                                             not null,
    user_id       uuid
        references users
            on delete cascade,
    created_at    timestamp with time zone default now(),
    score         double precision                                    not null,
    hypers        jsonb                                               not null,
    meta          jsonb
);

create index ix_model_hypers_model_version
    on model_hypers (model_version);

create index ix_model_hypers_created_at
    on model_hypers (created_at);

create index ix_model_hypers_model
    on model_hypers (model);

create table groups
(
    id                   uuid                     default uuid_generate_v4()     not null
        primary key,
    owner_id             uuid                                                    not null
        references users
            on delete cascade,
    title                varchar                                                 not null,
    text_short           varchar                                                 not null,
    text_long            varchar,
    privacy              groupprivacy             default 'public'::groupprivacy not null,
    official             boolean                  default false,
    created_at           timestamp with time zone default now(),
    updated_at           timestamp with time zone default now(),
    n_members            integer                  default 1                      not null,
    n_messages           integer                  default 0                      not null,
    last_message         timestamp with time zone default now()                  not null,
    owner_name           varchar,
    perk_member          double precision,
    perk_member_donation boolean                  default false,
    perk_entry           double precision,
    perk_entry_donation  boolean                  default false,
    perk_video           double precision,
    perk_video_donation  boolean                  default false
);

create index ix_groups_owner_id
    on groups (owner_id);

create index ix_groups_updated_at
    on groups (updated_at);

create index ix_groups_created_at
    on groups (created_at);

create table payments
(
    id         uuid                     default uuid_generate_v4() not null
        primary key,
    user_id    uuid
        references users
            on delete cascade,
    created_at timestamp with time zone default now(),
    event_type varchar                                             not null,
    data       jsonb                                               not null
);

create index ix_payments_created_at
    on payments (created_at);

create index ix_payments_user_id
    on payments (user_id);

create table notes
(
    id         uuid                     default uuid_generate_v4() not null
        primary key,
    created_at timestamp with time zone default now(),
    entry_id   uuid
        references entries
            on delete cascade,
    user_id    uuid
        references users
            on delete cascade,
    type       notetypes                                           not null,
    text       varchar                                             not null,
    private    boolean                  default false
);

create index ix_notes_created_at
    on notes (created_at);

create index ix_notes_entry_id
    on notes (entry_id);

create index ix_notes_user_id
    on notes (user_id);

create table field_entries
(
    id         uuid                     default uuid_generate_v4() not null
        primary key,
    value      double precision,
    created_at timestamp with time zone default now(),
    user_id    uuid
        references users
            on delete cascade,
    field_id   uuid
        references fields
            on delete cascade
);

create index ix_field_entries_created_at
    on field_entries (created_at);

create index ix_field_entries_user_id
    on field_entries (user_id);

create table field_entries2
(
    field_id   uuid not null
        references fields
            on delete cascade,
    day        date not null,
    created_at timestamp with time zone default now(),
    value      double precision,
    user_id    uuid
        references users
            on delete cascade,
    dupes      jsonb,
    dupe       integer                  default 0,
    primary key (field_id, day)
);

create index ix_field_entries2_user_id
    on field_entries2 (user_id);

create index ix_field_entries2_created_at
    on field_entries2 (created_at);

create index ix_field_entries2_day
    on field_entries2 (day);

create index ix_field_entries2_field_id
    on field_entries2 (field_id);

create table entries_tags
(
    entry_id uuid not null
        references entries
            on delete cascade,
    tag_id   uuid not null
        references tags
            on delete cascade,
    primary key (entry_id, tag_id)
);

create table shares_tags
(
    share_id uuid not null
        references shares
            on delete cascade,
    tag_id   uuid not null
        references tags
            on delete cascade,
    selected boolean default true,
    primary key (share_id, tag_id)
);

create table shares_users
(
    share_id uuid not null
        references shares
            on delete cascade,
    obj_id   uuid not null
        references users
            on delete cascade,
    primary key (share_id, obj_id)
);

create table shares_groups
(
    share_id uuid not null
        references shares
            on delete cascade,
    obj_id   uuid not null
        references groups
            on delete cascade,
    primary key (share_id, obj_id)
);

create table influencers
(
    field_id      uuid             not null
        references fields
            on delete cascade,
    influencer_id uuid             not null
        references fields
            on delete cascade,
    score         double precision not null,
    primary key (field_id, influencer_id)
);

create table users_groups
(
    user_id   uuid                                                  not null
        references users
            on delete cascade,
    group_id  uuid                                                  not null
        references groups
            on delete cascade,
    username  varchar                                               not null,
    joined_at timestamp with time zone default now(),
    role      grouproles               default 'member'::grouproles not null,
    primary key (user_id, group_id)
);

create index ix_users_groups_joined_at
    on users_groups (joined_at);

create table groups_messages
(
    id         uuid                     default uuid_generate_v4() not null
        primary key,
    user_id    uuid
        references users
            on delete cascade,
    obj_id     uuid
        references groups
            on delete cascade,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    text       varchar                                             not null
);

create index ix_groups_messages_updated_at
    on groups_messages (updated_at);

create index ix_groups_messages_user_id
    on groups_messages (user_id);

create index ix_groups_messages_obj_id
    on groups_messages (obj_id);

create index ix_groups_messages_created_at
    on groups_messages (created_at);

create table groups_notifs
(
    user_id   uuid not null
        references users
            on delete cascade,
    obj_id    uuid not null
        references groups
            on delete cascade,
    count     integer                  default 0,
    last_seen timestamp with time zone default now(),
    primary key (user_id, obj_id)
);

create index ix_groups_notifs_last_seen
    on groups_notifs (last_seen);

create table notes_notifs
(
    user_id   uuid not null
        references users
            on delete cascade,
    obj_id    uuid not null
        references entries
            on delete cascade,
    count     integer                  default 0,
    last_seen timestamp with time zone default now(),
    primary key (user_id, obj_id)
);

create index ix_notes_notifs_last_seen
    on notes_notifs (last_seen);

create table shares_notifs
(
    user_id   uuid not null
        references users
            on delete cascade,
    obj_id    uuid not null
        references shares
            on delete cascade,
    count     integer                  default 0,
    last_seen timestamp with time zone default now(),
    primary key (user_id, obj_id)
);

create index ix_shares_notifs_last_seen
    on shares_notifs (last_seen);

create table ws_connections
(
    user_id uuid not null
        references users
            on delete cascade,
    connection_id   varchar not null,
    primary key (user_id, connection_id)
);
