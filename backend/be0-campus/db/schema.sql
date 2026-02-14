-- SQLite3 database for Super App

-- Drop and recreate table for new schema (for dev only, remove DROP in prod)
DROP TABLE IF EXISTS apps;
CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  icon TEXT,
  category TEXT,
  color TEXT,
  gradient TEXT,
  newTab INTEGER DEFAULT 0,
  isenabled INTEGER NOT NULL DEFAULT 1
);

-- Table for users (for future use, if needed)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0
);
