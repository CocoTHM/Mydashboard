# 🚀 Guide de Démarrage Rapide

## Prérequis

- Node.js 18 ou supérieur
- Docker et Docker Compose
- Git
- (Optionnel) PostgreSQL et Redis en local

## Installation

### 1. Configuration initiale

```bash
# Cloner le projet
cd "My dashboard"

# Copier le fichier d'environnement
cp .env.example .env
```

### 2. Configurer les variables d'environnement

Éditer le fichier `.env` :

```env
# Base de données
DATABASE_URL=postgresql://dashboard:dashboard_password@localhost:5432/dashboard

# JWT (générer une clé secrète forte)
JWT_SECRET=votre-secret-jwt-super-securise-minimum-32-caracteres

# Encryption (DOIT faire exactement 32 caractères)
ENCRYPTION_KEY=votre-cle-de-chiffrement-32-c

# GitHub OAuth (créer une OAuth App sur GitHub)
GITHUB_CLIENT_ID=votre-github-client-id
GITHUB_CLIENT_SECRET=votre-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback

# URLs
NEXT_PUBLIC_API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

### 3. Lancer avec Docker (Recommandé)

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

Les services seront disponibles sur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **API Documentation** : http://localhost:3001/api/docs

### 4. Configuration de la base de données

```bash
# Entrer dans le conteneur backend
docker exec -it dashboard-backend sh

# Générer le client Prisma
npx prisma generate

# Créer les migrations
npx prisma migrate dev --name init

# (Optionnel) Ouvrir Prisma Studio
npx prisma studio
```

## Installation locale (Sans Docker)

### Backend

```bash
cd backend

# Installer les dépendances
npm install

# Démarrer PostgreSQL et Redis localement
# Assurez-vous que les services tournent sur les ports par défaut

# Générer le client Prisma
npx prisma generate

# Créer la base de données
npx prisma migrate dev

# Démarrer le serveur
npm run start:dev
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## Configuration GitHub OAuth

1. Aller sur https://github.com/settings/developers
2. Cliquer sur "New OAuth App"
3. Remplir :
   - Application name: `My Dashboard`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3001/api/auth/github/callback`
4. Copier le Client ID et générer un Client Secret
5. Mettre à jour `.env` avec ces valeurs

## Configuration des Providers VM

### AWS EC2

1. Créer un utilisateur IAM avec les permissions EC2
2. Générer des access keys
3. Les ajouter dans `.env` :

```env
AWS_ACCESS_KEY_ID=votre-access-key
AWS_SECRET_ACCESS_KEY=votre-secret-key
AWS_REGION=us-east-1
```

### Azure

1. Créer un Service Principal dans Azure
2. Noter le Subscription ID, Tenant ID, Client ID et Secret
3. Les ajouter dans `.env` :

```env
AZURE_SUBSCRIPTION_ID=votre-subscription-id
AZURE_TENANT_ID=votre-tenant-id
AZURE_CLIENT_ID=votre-client-id
AZURE_CLIENT_SECRET=votre-client-secret
```

### Proxmox

Lors de l'ajout d'une VM Proxmox, fournir :
- Host : `proxmox.local`
- Port : `8006`
- Username : `root@pam`
- Password : (votre mot de passe)
- Node : nom du nœud Proxmox
- VMID : ID de la VM

## Utilisation

### Ajouter une VM

1. Aller sur `/vm`
2. Cliquer sur "Nouvelle VM"
3. Remplir le formulaire :
   - Nom
   - Provider (AWS, Azure, GCP, Proxmox, etc.)
   - Instance ID (format dépend du provider)
   - Credentials (chiffrés automatiquement)
   - Tags

### Démarrer/Arrêter une VM

1. Sur la page `/vm`, cliquer sur une carte VM
2. Utiliser les boutons :
   - **Start** : Démarrer la VM
   - **Stop** : Arrêter la VM
   - **Restart** : Redémarrer la VM
3. Le statut se met à jour en temps réel via WebSocket

### Voir les métriques

1. Sélectionner une VM
2. Les métriques (CPU, RAM, Disk) s'affichent automatiquement
3. Cliquer sur "Métriques détaillées" pour plus d'informations

## Dépannage

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL tourne
docker ps | grep postgres

# Voir les logs
docker logs dashboard-postgres

# Recréer le conteneur
docker-compose down
docker-compose up -d postgres
```

### Erreur "ENCRYPTION_KEY must be 32 characters"

Votre clé de chiffrement doit faire **exactement 32 caractères** :

```bash
# Générer une clé sécurisée
openssl rand -base64 32 | head -c 32
```

### Erreur GitHub OAuth

1. Vérifier que les URLs de callback correspondent
2. Vérifier que le Client ID et Secret sont corrects
3. S'assurer que l'app GitHub OAuth est active

### WebSocket ne fonctionne pas

1. Vérifier que `NEXT_PUBLIC_WS_URL` est correct
2. S'assurer que le port 3001 est accessible
3. Vérifier les logs backend pour voir les connexions WebSocket

## Scripts utiles

```bash
# Voir tous les conteneurs
docker-compose ps

# Redémarrer un service spécifique
docker-compose restart backend

# Voir les logs d'un service
docker-compose logs -f backend

# Entrer dans un conteneur
docker exec -it dashboard-backend sh

# Nettoyer tout (⚠️ supprime les données)
docker-compose down -v

# Reconstruire les images
docker-compose build --no-cache

# Sauvegarder la base de données
docker exec dashboard-postgres pg_dump -U dashboard dashboard > backup.sql

# Restaurer la base de données
cat backup.sql | docker exec -i dashboard-postgres psql -U dashboard dashboard
```

## Sécurité en Production

### ⚠️ Avant de déployer en production :

1. **Changer tous les secrets** :
   - `JWT_SECRET` : minimum 32 caractères aléatoires
   - `ENCRYPTION_KEY` : exactement 32 caractères aléatoires
   - Mots de passe de base de données

2. **Activer HTTPS** :
   - Utiliser un reverse proxy (Nginx, Traefik)
   - Obtenir un certificat SSL (Let's Encrypt)

3. **Configurer les CORS** :
   - Restreindre aux domaines autorisés
   - Ne pas utiliser `*`

4. **Variables d'environnement** :
   - Utiliser un gestionnaire de secrets (AWS Secrets Manager, Azure Key Vault)
   - Ne JAMAIS commiter `.env`

5. **Base de données** :
   - Utiliser une instance managée (RDS, Azure SQL)
   - Activer les sauvegardes automatiques
   - Configurer des utilisateurs avec des permissions limitées

6. **Monitoring** :
   - Configurer des alertes
   - Logs centralisés
   - Métriques de performance

## Support

Pour plus d'informations, consulter :
- [README.md](README.md) - Documentation complète
- [Backend API Docs](http://localhost:3001/api/docs) - Documentation Swagger
- Issues GitHub pour signaler des bugs

## Prochaines étapes

1. Personnaliser le dashboard
2. Ajouter vos VM
3. Configurer les intégrations (GitHub, providers cloud)
4. Explorer toutes les fonctionnalités (dépenses, tâches, roadmaps)

Bon développement ! 🎉
