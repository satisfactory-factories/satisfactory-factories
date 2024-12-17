#!/bin/bash

# MongoDB backup script with SCRAM-SHA-1 authentication and password prompt

# Configuration
DB_NAME="factory_planner"                       # Name of the database to back up
BACKUP_PATH=~/dumps/satisfactory-factories      # Directory to store backups
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")              # Timestamp for unique backup
MONGO_HOST="10.0.5.2"                           # MongoDB host
MONGO_PORT="27117"                              # MongoDB port (default: 27017)
MONGO_USER="sf"                                 # Username

# Prompt the user for the password
echo -n "Enter password for MongoDB user $MONGO_USER: "
read -s MONGO_PASS
echo

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_PATH"

# Backup command
echo "Starting backup for database: $DB_NAME"
if mongodump --host "$MONGO_HOST" --port "$MONGO_PORT" \
             --username "$MONGO_USER" --password "$MONGO_PASS" \
             --db "$DB_NAME" --out "$BACKUP_PATH/$DB_NAME-$TIMESTAMP"; then
  echo "Backup completed successfully."
  echo "Backup stored in: $BACKUP_PATH/$DB_NAME-$TIMESTAMP"
else
  echo "Backup failed."
  exit 1
fi
