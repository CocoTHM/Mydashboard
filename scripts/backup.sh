#!/bin/bash

# Script de backup automatique
# À ajouter dans cron: 0 3 * * * /path/to/backup.sh

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/home/dashboard/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${RETENTION_DAYS:-7}
CONTAINER_NAME="dashboard-postgres"
DB_USER="${POSTGRES_USER:-dashboard}"
DB_NAME="${POSTGRES_DB:-dashboard}"

# Créer le répertoire de backup
mkdir -p $BACKUP_DIR

echo "🔄 Démarrage du backup: $DATE"

# Backup PostgreSQL
echo "📊 Backup de la base de données PostgreSQL..."
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > \
  $BACKUP_DIR/db_backup_$DATE.sql.gz

if [ $? -eq 0 ]; then
    echo "✅ Backup DB terminé: $BACKUP_DIR/db_backup_$DATE.sql.gz"
else
    echo "❌ Erreur lors du backup de la base de données"
    exit 1
fi

# Backup du fichier .env.production
if [ -f ".env.production" ]; then
    echo "📄 Backup du fichier .env.production..."
    cp .env.production $BACKUP_DIR/env_backup_$DATE
    echo "✅ Backup .env terminé"
fi

# Calculer la taille du backup
SIZE=$(du -h $BACKUP_DIR/db_backup_$DATE.sql.gz | cut -f1)
echo "📦 Taille du backup: $SIZE"

# Supprimer les backups anciens
echo "🧹 Nettoyage des backups de plus de $RETENTION_DAYS jours..."
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -type f -name "env_backup_*" -mtime +$RETENTION_DAYS -delete

# Lister les backups restants
echo "📂 Backups disponibles:"
ls -lh $BACKUP_DIR

# Upload vers S3 (décommenter si configuré)
# if command -v aws &> /dev/null; then
#     echo "☁️  Upload vers S3..."
#     aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://votre-bucket/backups/
#     echo "✅ Upload S3 terminé"
# fi

echo "✨ Backup terminé avec succès: $DATE"

# Notification (optionnel - décommenter et configurer)
# curl -X POST https://api.telegram.org/bot<TOKEN>/sendMessage \
#   -d chat_id=<CHAT_ID> \
#   -d text="✅ Backup dashboard terminé: $DATE ($SIZE)"
