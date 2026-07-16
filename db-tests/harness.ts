/**
 * Real-Postgres test harness for the Truedeed introductions-ledger migration.
 *
 * Boots an ephemeral `postgres:15-alpine` container via `docker run --rm -d`,
 * waits for readiness, and exposes synchronous SQL helpers that shell out via
 * `docker exec <name> psql` (sync child_process — no npm deps, no node-postgres).
 *
 * `applyPrerequisites()` creates a minimal stub of the EXISTING britv3 schema
 * that `supabase/migrations/20260612000000_truedeed_introductions.sql`
 * references (auth schema/uid(), profiles, properties, listings,
 * agent_branches, agent_team_members, Supabase roles + grants, storage.buckets).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const READY_TIMEOUT_MS = 60_000;
const READY_POLL_MS = 300;
/** Require N consecutive successful queries — the postgres image restarts
 *  the server once after initdb, so a single pg_isready success can be a lie. */
const READY_CONSECUTIVE_OK = 2;

const PSQL_BASE_ARGS = [
  "psql",
  "-U",
  "postgres",
  "-d",
  "postgres",
  "-X",
  "-q",
  "-t",
  "-A",
  "-v",
  "ON_ERROR_STOP=1",
];

export type DbHarness = {
  containerName: string;
  hostPort: number;
  /** Run SQL (single or multi-statement) via `docker exec … psql -c`.
   *  Returns trimmed stdout (tuples-only, unaligned). Throws an Error whose
   *  message includes psql's stderr on failure. */
  sql: (query: string) => string;
  /** Pipe a SQL file into `docker exec -i … psql`. Throws ENOENT if the file
   *  does not exist (this is the RED signal while the migration is missing). */
  sqlFile: (path: string) => string;
  /** Remove the container. Safe to call multiple times. */
  stop: () => void;
};

function sleepMs(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function docker(args: readonly string[], input?: string): string {
  const result = spawnSync("docker", [...args], {
    encoding: "utf8",
    input,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `docker ${args[0]} failed (exit ${result.status}): ${result.stderr || result.stdout}`,
    );
  }
  return result.stdout;
}

function tryDocker(args: readonly string[]): boolean {
  const result = spawnSync("docker", [...args], { encoding: "utf8" });
  return !result.error && result.status === 0;
}

function waitForReady(containerName: string): void {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let consecutiveOk = 0;
  while (consecutiveOk < READY_CONSECUTIVE_OK) {
    if (Date.now() > deadline) {
      docker(["rm", "-f", containerName]);
      throw new Error(
        `Postgres container ${containerName} not ready after ${READY_TIMEOUT_MS}ms`,
      );
    }
    const isReady =
      tryDocker(["exec", containerName, "pg_isready", "-U", "postgres"]) &&
      tryDocker(["exec", containerName, ...PSQL_BASE_ARGS, "-c", "select 1"]);
    consecutiveOk = isReady ? consecutiveOk + 1 : 0;
    sleepMs(READY_POLL_MS);
  }
}

export function startPostgres(): DbHarness {
  const containerName = `truedeed-dbtest-${process.pid}-${Date.now()}`;
  // Port 0 → Docker picks a free ephemeral high port on the host.
  docker([
    "run",
    "--rm",
    "-d",
    "--name",
    containerName,
    "-e",
    "POSTGRES_HOST_AUTH_METHOD=trust",
    "-p",
    "127.0.0.1:0:5432",
    "postgres:15-alpine",
  ]);

  let stopped = false;
  const stop = (): void => {
    if (stopped) return;
    stopped = true;
    spawnSync("docker", ["rm", "-f", containerName], { encoding: "utf8" });
  };

  try {
    waitForReady(containerName);
  } catch (error) {
    stop();
    throw error;
  }

  const portLine = docker(["port", containerName, "5432/tcp"]).trim().split("\n")[0];
  const hostPort = Number(portLine.split(":").pop());

  const sql = (query: string): string =>
    docker(["exec", containerName, ...PSQL_BASE_ARGS, "-c", query]).trim();

  const sqlFile = (path: string): string => {
    const contents = readFileSync(path, "utf8");
    return docker(["exec", "-i", containerName, ...PSQL_BASE_ARGS], contents).trim();
  };

  return { containerName, hostPort, sql, sqlFile, stop };
}

/**
 * Minimal stub of the pre-existing britv3/Supabase schema the Truedeed
 * migration depends on. Deliberately permissive grants: the migration's own
 * REVOKEs + RLS must do the restricting, exactly as on hosted Supabase.
 */
const PREREQUISITES_SQL = `
create extension if not exists pgcrypto;
alter database postgres set timezone to 'UTC';
set timezone to 'UTC';

-- ===== Supabase roles =====
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;

-- ===== auth schema stub =====
create schema auth;
create table auth.users (
  id uuid primary key,
  email text,
  email_confirmed_at timestamptz
);
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- ===== existing public tables the migration references =====
create table public.profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  is_admin boolean default false
);
create table public.properties (
  id uuid primary key,
  address_line1 text,
  postcode text
);
create table public.listings (
  id uuid primary key,
  property_id uuid references public.properties(id),
  user_id uuid references auth.users(id),
  status text default 'active'
);
create table public.agent_branches (
  id uuid primary key,
  agent_id uuid references auth.users(id),
  name text
);
create table public.agent_team_members (
  user_id uuid,
  branch_id uuid references public.agent_branches(id),
  role text,
  primary key (user_id, branch_id)
);

-- ===== Supabase-style grants (the migration must restrict, not us) =====
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables
  to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences
  to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions
  to anon, authenticated, service_role;

-- ===== storage stub (for the rebuttal-evidence bucket insert) =====
create schema storage;
create table storage.buckets (
  id text primary key,
  name text,
  public boolean
);
grant usage on schema storage to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
`;

export function applyPrerequisites(harness: DbHarness): void {
  harness.sql(PREREQUISITES_SQL);
}
