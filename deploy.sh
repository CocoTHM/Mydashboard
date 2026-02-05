#!/bin/bash

# Script de déploiement automatique
# Usage: ./deploy.sh [staging|production]

set -e

ENV=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.${ENV}"

echo "🚀 Déploiement en environnement: $ENV"

# Vérifier que le fichier .env existe
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Erreur: Le fichier $ENV_FILE n'existe pas"
    exit 1
fi

# Charger les variables d'environnement
export $(cat $ENV_FILE | grep -v '^#' | xargs)

echo "📦 Récupération des dernières modifications..."
git pull origin main

echo "🛑 Arrêt des conteneurs existants..."
docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down

echo "🔨 Construction des nouvelles images..."
docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE build --no-cache

echo "🚀 Démarrage des nouveaux conteneurs..."
docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

echo "⏳ Attente du démarrage des services..."
sleep 10

echo "📊 Exécution des migrations de base de données..."
docker exec dashboard-backend npx prisma migrate deploy

echo "🧹 Nettoyage des images inutilisées..."
docker system prune -f

echo "✅ Déploiement terminé avec succès!"
echo ""
echo "Services disponibles:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend: http://localhost:3001"
echo "  - API Docs: http://localhost:3001/api/docs"
echo ""
echo "Pour voir les logs:"
echo "  docker-compose -f $COMPOSE_FILE logs -f"
