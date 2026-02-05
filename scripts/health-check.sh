#!/bin/bash

# Script de monitoring de santé des services
# À ajouter dans cron: */5 * * * * /path/to/health-check.sh

set -e

SERVICES=("dashboard-backend" "dashboard-frontend" "dashboard-postgres" "dashboard-redis")
ERRORS=0
ERROR_MSG=""

echo "🏥 Vérification de santé des services..."
echo "Date: $(date)"
echo ""

for SERVICE in "${SERVICES[@]}"; do
    echo -n "Vérification de $SERVICE... "
    
    # Vérifier si le conteneur tourne
    if docker ps --format '{{.Names}}' | grep -q "^${SERVICE}$"; then
        # Vérifier le health status
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' $SERVICE 2>/dev/null || echo "none")
        
        if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "none" ]; then
            echo "✅ OK"
        else
            echo "⚠️  WARNING (status: $HEALTH)"
            ERRORS=$((ERRORS + 1))
            ERROR_MSG="$ERROR_MSG\n$SERVICE: status $HEALTH"
        fi
    else
        echo "❌ STOPPED"
        ERRORS=$((ERRORS + 1))
        ERROR_MSG="$ERROR_MSG\n$SERVICE: conteneur arrêté"
    fi
done

echo ""

# Vérifier l'espace disque
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
echo -n "Utilisation disque: $DISK_USAGE%... "
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "❌ CRITIQUE"
    ERRORS=$((ERRORS + 1))
    ERROR_MSG="$ERROR_MSG\nDisque: $DISK_USAGE% utilisé"
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️  WARNING"
else
    echo "✅ OK"
fi

# Vérifier la mémoire
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
echo -n "Utilisation mémoire: $MEM_USAGE%... "
if [ "$MEM_USAGE" -gt 90 ]; then
    echo "❌ CRITIQUE"
    ERRORS=$((ERRORS + 1))
    ERROR_MSG="$ERROR_MSG\nMémoire: $MEM_USAGE% utilisée"
elif [ "$MEM_USAGE" -gt 80 ]; then
    echo "⚠️  WARNING"
else
    echo "✅ OK"
fi

echo ""

# Résumé
if [ $ERRORS -eq 0 ]; then
    echo "✅ Tous les services sont opérationnels"
    exit 0
else
    echo "❌ $ERRORS erreur(s) détectée(s)"
    echo -e "$ERROR_MSG"
    
    # Envoyer une notification (décommenter et configurer)
    # curl -X POST https://api.telegram.org/bot<TOKEN>/sendMessage \
    #   -d chat_id=<CHAT_ID> \
    #   -d text="🚨 Dashboard Alert: $ERRORS erreur(s) - $ERROR_MSG"
    
    exit 1
fi
