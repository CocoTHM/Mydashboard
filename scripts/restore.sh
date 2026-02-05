#!/bin/bash

# Script de restauration de backup
# Usage: ./restore.sh <backup_file.sql.gz>

set -e

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <backup_file.sql.gz>"
    echo "Exemple: $0 /path/to/db_backup_20260203_030000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1
CONTAINER_NAME="dashboard-postgres"
DB_USER="${POSTGRES_USER:-dashboard}"
DB_NAME="${POSTGRES_DB:-dashboard}"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Erreur: Le fichier $BACKUP_FILE n'existe pas"
    exit 1
fi

echo "⚠️  ATTENTION: Cette opération va écraser la base de données actuelle!"
echo "Fichier de backup: $BACKUP_FILE"
echo ""
read -p "Êtes-vous sûr de vouloir continuer? (oui/non) " -n 3 -r
echo
if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
    echo "❌ Restauration annulée"
    exit 1
fi

echo "🔄 Démarrage de la restauration..."

# Arrêter le backend pour éviter les connexions actives
echo "🛑 Arrêt du backend..."
docker-compose -f docker-compose.prod.yml stop backend

# Vider la base de données actuelle
echo "🗑️  Suppression de la base de données actuelle..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restaurer le backup
echo "📊 Restauration du backup..."
gunzip -c $BACKUP_FILE | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME

if [ $? -eq 0 ]; then
    echo "✅ Restauration terminée avec succès"
else
    echo "❌ Erreur lors de la restauration"
    exit 1
fi

# Redémarrer le backend
echo "🚀 Redémarrage du backend..."
docker-compose -f docker-compose.prod.yml start backend

echo "✨ Restauration complète!"
echo ""
echo "Vérifiez que l'application fonctionne correctement:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend: http://localhost:3001"
