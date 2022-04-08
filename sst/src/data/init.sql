-- noinspection SqlNoDataSourceInspectionForFile

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create table users (
	id uuid not null
		constraint users_pkey primary key,
	email varchar not null
);

create table ws_connections (
  connection_id varchar not null,
  user_id uuid not null
    constraint ws_connections_user_id_fkey references users on delete cascade,
  constraint ws_connections_pkey primary key (connection_id, user_id)
);
