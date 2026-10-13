#!/usr/bin/env bash
# ==============================================================================
# SANGITA TRAVELS PUNE - AUTOMATED SQLITE DATABASE BACKUP & ROTATION
# Creates atomic online SQLite backup snapshot, gzips it, and purges backups > 30 days
# ==============================================================================

set -euo pipefail

DB_PATH="${1:-/var/www/punemumbaicab/backend/data/bookings.db}"
BACKUP_DIR="${2:-/var/backups/sangita-cab}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SNAPSHOT_FILE="$BACKUP_DIR/bookings_${TIMESTAMP}.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database file not found at $DB_PATH"
    exit 1
fi

echo "Creating atomic online backup of $DB_PATH..."
sqlite3 "$DB_PATH" ".backup '$SNAPSHOT_FILE'"

echo "Compressing snapshot..."
gzip -9 "$SNAPSHOT_FILE"

echo "Pruning backups older than 30 days..."
find "$BACKUP_DIR" -name "bookings_*.db.gz" -type f -mtime +30 -delete

BACKUP_SIZE=$(du -h "${SNAPSHOT_FILE}.gz" | cut -f1)
echo "✅ Backup created successfully: ${SNAPSHOT_FILE}.gz ($BACKUP_SIZE)"
