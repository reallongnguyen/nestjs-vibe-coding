-- NOTE: change to your own passwords for production environments
\set pgpass `echo "$POSTGRES_PASSWORD"`

CREATE USER postgres LOGIN CREATEROLE CREATEDB REPLICATION BYPASSRLS;
CREATE USER supabase_admin LOGIN CREATEROLE CREATEDB REPLICATION BYPASSRLS;

-- Supabase super admin
CREATE USER supabase_auth_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION PASSWORD :'pgpass';
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
GRANT CREATE ON DATABASE postgres TO supabase_auth_admin;
ALTER USER supabase_auth_admin SET search_path = 'auth';
