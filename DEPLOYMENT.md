# 🚀 Guide de Déploiement en Production

## Table des matières

1. [Préparation](#préparation)
2. [Option 1 : VPS (DigitalOcean, Hetzner, OVH)](#option-1--vps)
3. [Option 2 : AWS (EC2 + RDS)](#option-2--aws)
4. [Option 3 : Azure (App Service)](#option-3--azure)
5. [Option 4 : Vercel + Railway](#option-4--vercel--railway)
6. [Configuration Nginx](#configuration-nginx)
7. [SSL/HTTPS avec Let's Encrypt](#sslhttps)
8. [CI/CD avec GitHub Actions](#cicd)
9. [Monitoring et Logs](#monitoring)
10. [Backup et Restauration](#backup)

---

## Préparation

### 1. Checklist avant déploiement

- [ ] Domaine configuré (ex: dashboard.votredomaine.com)
- [ ] Certificat SSL (Let's Encrypt recommandé)
- [ ] Variables d'environnement sécurisées
- [ ] Base de données de production
- [ ] GitHub OAuth configuré pour production
- [ ] Providers VM configurés (AWS, Azure, etc.)
- [ ] Backup strategy définie

### 2. Générer des secrets sécurisés

```bash
# JWT Secret (32+ caractères)
openssl rand -base64 48

# Encryption Key (exactement 32 caractères)
openssl rand -base64 32 | head -c 32

# PostgreSQL Password
openssl rand -base64 32
```

### 3. Configuration GitHub OAuth pour Production

1. Aller sur https://github.com/settings/developers
2. Créer une nouvelle OAuth App :
   - Homepage URL: `https://dashboard.votredomaine.com`
   - Callback URL: `https://api.votredomaine.com/api/auth/github/callback`
3. Noter le Client ID et Client Secret

---

## Option 1 : VPS (DigitalOcean, Hetzner, OVH)

### Configuration recommandée

- **CPU** : 2 vCPUs minimum
- **RAM** : 4 GB minimum (8 GB recommandé)
- **Storage** : 50 GB SSD
- **OS** : Ubuntu 22.04 LTS

### Étape 1 : Préparer le serveur

```bash
# Se connecter au serveur
ssh root@votre-ip

# Mettre à jour le système
apt update && apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose
apt install docker-compose-plugin -y

# Créer un utilisateur non-root
adduser dashboard
usermod -aG docker dashboard
usermod -aG sudo dashboard

# Configurer le firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Étape 2 : Déployer l'application

```bash
# Se connecter avec l'utilisateur dashboard
su - dashboard

# Cloner le repository
git clone https://github.com/votre-username/dashboard.git
cd dashboard

# Copier et configurer l'environnement
cp .env.example .env.production
nano .env.production
```

**Configurer `.env.production`** :

```env
# Base de données PostgreSQL
POSTGRES_USER=dashboard_prod
POSTGRES_PASSWORD=votre-mot-de-passe-securise
POSTGRES_DB=dashboard_prod
DATABASE_URL=postgresql://dashboard_prod:votre-mot-de-passe-securise@postgres:5432/dashboard_prod

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Backend
NODE_ENV=production
PORT=3001

# JWT
JWT_SECRET=votre-jwt-secret-super-securise-48-caracteres-minimum
JWT_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=votre-cle-32-caracteres-exact

# GitHub OAuth
GITHUB_CLIENT_ID=votre-github-client-id-production
GITHUB_CLIENT_SECRET=votre-github-client-secret-production
GITHUB_CALLBACK_URL=https://api.votredomaine.com/api/auth/github/callback

# URLs
NEXT_PUBLIC_API_URL=https://api.votredomaine.com
NEXT_PUBLIC_WS_URL=wss://api.votredomaine.com
FRONTEND_URL=https://dashboard.votredomaine.com

# AWS (optionnel)
AWS_ACCESS_KEY_ID=votre-aws-access-key
AWS_SECRET_ACCESS_KEY=votre-aws-secret-key
AWS_REGION=us-east-1

# Azure (optionnel)
AZURE_SUBSCRIPTION_ID=votre-azure-subscription-id
AZURE_TENANT_ID=votre-azure-tenant-id
AZURE_CLIENT_ID=votre-azure-client-id
AZURE_CLIENT_SECRET=votre-azure-client-secret
```

### Étape 3 : Lancer avec Docker

```bash
# Utiliser docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs -f

# Exécuter les migrations
docker exec dashboard-backend npx prisma migrate deploy
```

### Étape 4 : Configurer Nginx (voir section dédiée)

---

## Option 2 : AWS (EC2 + RDS)

### Architecture AWS

```
┌─────────────────────────────────────────────────┐
│                  Route 53                        │
│         (dashboard.votredomaine.com)            │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│            Application Load Balancer            │
│               (SSL Termination)                 │
└──────┬──────────────────────────┬───────────────┘
       │                          │
┌──────▼──────────┐      ┌───────▼────────────┐
│   EC2 Instance  │      │  EC2 Instance      │
│   (Frontend +   │      │  (Frontend +       │
│    Backend)     │      │   Backend)         │
└─────────────────┘      └────────────────────┘
       │                          │
       └────────────┬─────────────┘
                    │
┌───────────────────▼────────────────────────────┐
│              RDS PostgreSQL                     │
│         (Multi-AZ, Automated Backups)          │
└─────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────┐
│           ElastiCache Redis                      │
└──────────────────────────────────────────────────┘
```

### Étape 1 : Créer l'infrastructure

#### 1.1 RDS PostgreSQL

```bash
# Via AWS Console ou CLI
aws rds create-db-instance \
  --db-instance-identifier dashboard-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username dashboardadmin \
  --master-user-password VotreMotDePasse \
  --allocated-storage 50 \
  --storage-type gp3 \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxxxxx
```

#### 1.2 ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id dashboard-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxxxxx
```

#### 1.3 EC2 Instance

```bash
# Lancer une instance EC2
aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --instance-type t3.medium \
  --key-name votre-cle-ssh \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --iam-instance-profile Name=dashboard-ec2-role \
  --user-data file://user-data.sh
```

**user-data.sh** :
```bash
#!/bin/bash
yum update -y
amazon-linux-extras install docker -y
service docker start
usermod -a -G docker ec2-user
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Étape 2 : Déployer sur EC2

```bash
# SSH dans l'instance
ssh -i votre-cle.pem ec2-user@votre-ec2-ip

# Cloner et configurer
git clone https://github.com/votre-username/dashboard.git
cd dashboard

# Configurer .env avec les endpoints AWS
nano .env.production

# DATABASE_URL doit pointer vers RDS
# REDIS_HOST doit pointer vers ElastiCache

# Lancer
docker-compose -f docker-compose.prod.yml up -d
```

### Étape 3 : Configurer Application Load Balancer

1. Créer un Target Group pour le port 3001 (backend) et 3000 (frontend)
2. Créer un ALB avec un listener HTTPS (port 443)
3. Configurer le certificat SSL (ACM)
4. Ajouter les règles de routing

---

## Option 3 : Azure (App Service)

### Étape 1 : Créer les ressources Azure

```bash
# Variables
RESOURCE_GROUP="dashboard-rg"
LOCATION="westeurope"
APP_SERVICE_PLAN="dashboard-plan"

# Créer le resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Créer PostgreSQL
az postgres flexible-server create \
  --name dashboard-postgres \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user dashboardadmin \
  --admin-password VotreMotDePasse \
  --sku-name Standard_B2s \
  --version 15

# Créer Redis
az redis create \
  --name dashboard-redis \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Basic \
  --vm-size c0

# Créer App Service Plan
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B2 \
  --is-linux

# Créer Web App pour Backend
az webapp create \
  --name dashboard-backend-api \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:18-lts"

# Créer Web App pour Frontend
az webapp create \
  --name dashboard-frontend \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:18-lts"
```

### Étape 2 : Configurer les variables d'environnement

```bash
# Backend
az webapp config appsettings set \
  --name dashboard-backend-api \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="postgresql://..." \
    JWT_SECRET="..." \
    ENCRYPTION_KEY="..."

# Frontend
az webapp config appsettings set \
  --name dashboard-frontend \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NEXT_PUBLIC_API_URL="https://dashboard-backend-api.azurewebsites.net"
```

### Étape 3 : Déployer via Git

```bash
# Configurer Git deployment
az webapp deployment source config-local-git \
  --name dashboard-backend-api \
  --resource-group $RESOURCE_GROUP

# Obtenir les credentials
az webapp deployment list-publishing-credentials \
  --name dashboard-backend-api \
  --resource-group $RESOURCE_GROUP

# Ajouter remote et pousser
cd backend
git remote add azure https://...
git push azure main:master
```

---

## Option 4 : Vercel (Frontend) + Railway (Backend + DB)

### Frontend sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
cd frontend
vercel

# Configurer les variables d'environnement sur Vercel Dashboard
# NEXT_PUBLIC_API_URL=https://votre-backend.railway.app
# NEXT_PUBLIC_WS_URL=wss://votre-backend.railway.app
```

### Backend sur Railway

1. Aller sur https://railway.app
2. Créer un nouveau projet
3. Ajouter PostgreSQL depuis les templates
4. Ajouter Redis depuis les templates
5. Créer un service depuis GitHub (backend)
6. Configurer les variables d'environnement
7. Railway génère automatiquement une URL

---

## Configuration Nginx

### Créer la configuration Nginx

**`/etc/nginx/sites-available/dashboard`** :

```nginx
# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name dashboard.votredomaine.com api.votredomaine.com;
    return 301 https://$server_name$request_uri;
}

# Frontend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dashboard.votredomaine.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/dashboard.votredomaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.votredomaine.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy vers Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.votredomaine.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.votredomaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.votredomaine.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Proxy vers Backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket timeouts
        proxy_read_timeout 86400;
    }
}
```

### Activer la configuration

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## SSL/HTTPS avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir les certificats
sudo certbot --nginx -d dashboard.votredomaine.com -d api.votredomaine.com

# Renouvellement automatique (ajouté par défaut)
# Vérifier avec :
sudo certbot renew --dry-run

# Le renouvellement automatique est configuré dans :
# /etc/cron.d/certbot ou via systemd timer
```

---

## CI/CD avec GitHub Actions

**`.github/workflows/deploy.yml`** :

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Backend Dependencies
        run: cd backend && npm ci
      
      - name: Run Backend Tests
        run: cd backend && npm test
      
      - name: Install Frontend Dependencies
        run: cd frontend && npm ci
      
      - name: Build Frontend
        run: cd frontend && npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/dashboard/dashboard
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker exec dashboard-backend npx prisma migrate deploy
            docker system prune -f
```

### Configurer les secrets GitHub

Dans les settings de votre repo GitHub :
- `SERVER_HOST` : IP de votre serveur
- `SERVER_USER` : nom d'utilisateur SSH
- `SSH_PRIVATE_KEY` : clé privée SSH
- `NEXT_PUBLIC_API_URL` : URL de votre API

---

## Monitoring et Logs

### 1. Logs avec Loki + Promtail + Grafana

**`docker-compose.monitoring.yml`** :

```yaml
version: '3.8'

services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
      - loki_data:/loki

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  loki_data:
  grafana_data:
```

### 2. Uptime Monitoring

Services recommandés :
- **UptimeRobot** (gratuit) : https://uptimerobot.com
- **Pingdom**
- **StatusCake**

### 3. Application Performance Monitoring (APM)

Options :
- **New Relic** : Complet mais payant
- **Sentry** : Excellent pour les erreurs
- **Datadog** : Enterprise-grade

---

## Backup et Restauration

### Script de backup automatique

**`backup.sh`** :

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/dashboard/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Créer le répertoire de backup
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec dashboard-postgres pg_dump -U dashboard dashboard > \
  $BACKUP_DIR/db_backup_$DATE.sql

# Backup des fichiers uploads (si applicable)
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /path/to/uploads

# Backup .env
cp /home/dashboard/dashboard/.env.production $BACKUP_DIR/env_backup_$DATE

# Supprimer les backups > 7 jours
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

# Upload vers S3 (optionnel)
# aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql s3://votre-bucket/backups/

echo "Backup completed: $DATE"
```

### Cron pour backups quotidiens

```bash
# Éditer crontab
crontab -e

# Ajouter (backup tous les jours à 3h du matin)
0 3 * * * /home/dashboard/backup.sh >> /var/log/dashboard-backup.log 2>&1
```

### Restauration

```bash
# Restaurer la base de données
cat backup.sql | docker exec -i dashboard-postgres psql -U dashboard dashboard

# Ou depuis un fichier compressé
gunzip -c backup.sql.gz | docker exec -i dashboard-postgres psql -U dashboard dashboard
```

---

## Checklist Post-Déploiement

- [ ] Application accessible via HTTPS
- [ ] Certificat SSL valide
- [ ] GitHub OAuth fonctionne
- [ ] Connexion à la base de données OK
- [ ] Redis connecté
- [ ] WebSocket fonctionne
- [ ] Providers VM configurés
- [ ] Backups automatiques configurés
- [ ] Monitoring en place
- [ ] Logs accessibles
- [ ] Firewall configuré
- [ ] Rate limiting actif
- [ ] Documentation mise à jour

---

## Dépannage

### Problème : Connexion base de données refusée

```bash
# Vérifier que PostgreSQL tourne
docker ps | grep postgres

# Vérifier les logs
docker logs dashboard-postgres

# Tester la connexion
docker exec -it dashboard-postgres psql -U dashboard
```

### Problème : Certificat SSL expiré

```bash
# Forcer le renouvellement
sudo certbot renew --force-renewal

# Recharger Nginx
sudo systemctl reload nginx
```

### Problème : WebSocket ne se connecte pas

1. Vérifier que le port est ouvert : `sudo ufw status`
2. Vérifier la configuration Nginx pour `/socket.io/`
3. Vérifier les logs backend : `docker logs dashboard-backend`

### Problème : Out of Memory

```bash
# Vérifier la mémoire
free -h

# Ajouter un swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Support et Ressources

- Documentation : [README.md](README.md)
- Architecture : [ARCHITECTURE.md](ARCHITECTURE.md)
- Issues GitHub : https://github.com/votre-repo/issues

🎉 **Votre dashboard est maintenant déployé en production !**
