#!/usr/bin/env bash
# Back up the database to a compressed, timestamped file.
#
#   DATABASE_URL='postgresql://user:pass@host/db?sslmode=require' ./scripts/backup_db.sh [output-dir]
#
# Restore into an EMPTY database with:
#   pg_restore --no-owner --dbname "$TARGET_DATABASE_URL" backups/nt-center-YYYYmmdd-HHMMSS.dump
#
# The file contains members' personal data (including children). Store it encrypted
# and somewhere only administrators can read; never commit it to git.
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Set DATABASE_URL to the database you want to back up." >&2
  exit 1
fi
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is not installed (macOS: brew install libpq && brew link --force libpq)." >&2
  exit 1
fi

out_dir="${1:-backups}"
mkdir -p "$out_dir"
chmod 700 "$out_dir"
# pg_dump expects a plain postgresql:// URL, not the app's async driver form.
url="${DATABASE_URL/postgresql+asyncpg:\/\//postgresql://}"
file="$out_dir/nt-center-$(date +%Y%m%d-%H%M%S).dump"

pg_dump --format=custom --no-owner --no-privileges --dbname "$url" --file "$file"
chmod 600 "$file"
echo "Backup written to $file ($(du -h "$file" | cut -f1))"
pg_restore --list "$file" >/dev/null && echo "Backup file verified (readable by pg_restore)."
