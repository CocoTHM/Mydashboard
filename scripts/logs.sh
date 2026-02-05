#!/bin/bash

# Script de logs en temps réel
# Usage: ./logs.sh [service_name]

SERVICE=${1:-all}

if [ "$SERVICE" = "all" ]; then
    echo "📋 Affichage des logs de tous les services..."
    docker-compose -f docker-compose.prod.yml logs -f
elif [ "$SERVICE" = "backend" ]; then
    echo "📋 Affichage des logs du backend..."
    docker logs -f dashboard-backend
elif [ "$SERVICE" = "frontend" ]; then
    echo "📋 Affichage des logs du frontend..."
    docker logs -f dashboard-frontend
elif [ "$SERVICE" = "postgres" ]; then
    echo "📋 Affichage des logs de PostgreSQL..."
    docker logs -f dashboard-postgres
elif [ "$SERVICE" = "redis" ]; then
    echo "📋 Affichage des logs de Redis..."
    docker logs -f dashboard-redis
else
    echo "❌ Service inconnu: $SERVICE"
    echo "Services disponibles: all, backend, frontend, postgres, redis"
    exit 1
fi
