-- Creates each service's database if it does not already exist.
-- Runs once on first container start via docker-entrypoint-initdb.d/.

SELECT 'CREATE DATABASE checklist_db'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'checklist_db')\gexec

SELECT 'CREATE DATABASE supplier_db'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'supplier_db')\gexec
