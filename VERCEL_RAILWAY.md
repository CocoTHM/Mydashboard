# 🚀 Déploiement Vercel + Railway

Guide complet pour déployer votre dashboard en production gratuitement.

## 📋 Vue d'ensemble

- **Frontend** → Vercel (gratuit)
- **Backend + PostgreSQL + Redis** → Railway (5$ gratuits/mois)
- **Temps estimé** : 15-20 minutes
- **Coût** : Gratuit (dans les limites de Railway)

## 🎯 Prérequis

- [ ] Compte GitHub (le projet doit être sur GitHub)
- [ ] Compte Vercel (https://vercel.com)
- [ ] Compte Railway (https://railway.app)
- [ ] GitHub OAuth App configurée

---

## Partie 1 : Configuration GitHub OAuth

### 1.1 Créer une GitHub OAuth App

1. Allez sur https://github.com/settings/developers
2. Cliquez sur **"New OAuth App"**
3. Remplissez :
   - **Application name** : `Dashboard Production`
   - **Homepage URL** : `https://votreapp.vercel.app` (à ajuster après)
   - **Authorization callback URL** : `https://votreapp-backend.railway.app/api/auth/github/callback`
4. Cliquez sur **"Register application"**
5. **Notez** le `Client ID`
6. Cliquez sur **"Generate a new client secret"** et **notez-le**

⚠️ **Important** : Vous devrez mettre à jour ces URLs après avoir obtenu vos URLs définitives.

---

## Partie 2 : Déploiement Backend sur Railway

### 2.1 Préparer le Backend

Créez un fichier `railway.json` à la racine :

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install && npx prisma generate"
  },
  "deploy": {
    "startCommand": "cd backend && npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2.2 Déployer sur Railway

1. **Allez sur** https://railway.app
2. **Cliquez** sur **"Start a New Project"**
3. **Choisissez** "Deploy from GitHub repo"
4. **Autorisez** Railway à accéder à votre repo
5. **Sélectionnez** votre repository `dashboard`

### 2.3 Ajouter PostgreSQL

1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Sélectionnez **"Database" → "PostgreSQL"**
3. Railway créera automatiquement la base de données
4. **Notez** la variable `DATABASE_URL` (visible dans l'onglet Variables)

### 2.4 Ajouter Redis

1. Cliquez à nouveau sur **"+ New"**
2. Sélectionnez **"Database" → "Redis"**
3. Railway créera automatiquement Redis
4. **Notez** les variables `REDIS_URL` ou `REDIS_HOST`, `REDIS_PORT`

### 2.5 Configurer les Variables d'Environnement Backend

Dans l'onglet **"Variables"** de votre service backend :

```env
# Node
NODE_ENV=production
PORT=3001

# Database (auto-générée par Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-générée par Railway)
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

# JWT (à générer)
JWT_SECRET=votre-jwt-secret-super-securise-48-caracteres
JWT_EXPIRES_IN=7d

# Encryption (générez avec: openssl rand -base64 32 | head -c 32)
ENCRYPTION_KEY=votre-cle-exactement-32-car

# GitHub OAuth (de l'étape 1.1)
GITHUB_CLIENT_ID=votre-github-client-id
GITHUB_CLIENT_SECRET=votre-github-client-secret
GITHUB_CALLBACK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/api/auth/github/callback

# Frontend URL (à mettre à jour après déploiement Vercel)
FRONTEND_URL=https://votreapp.vercel.app

# AWS (optionnel)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# Azure (optionnel)
AZURE_SUBSCRIPTION_ID=
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=

# GCP (optionnel)
GCP_PROJECT_ID=
GCP_CLIENT_EMAIL=
GCP_PRIVATE_KEY=

# Proxmox (optionnel)
PROXMOX_HOST=
PROXMOX_USER=
PROXMOX_PASSWORD=
```

### 2.6 Générer les Secrets

```bash
# JWT Secret (48+ caractères)
openssl rand -base64 48

# Encryption Key (exactement 32 caractères)
openssl rand -base64 32 | head -c 32
```

### 2.7 Exécuter les Migrations

1. Dans Railway, allez dans l'onglet **"Settings"**
2. Notez l'URL publique (ex: `dashboard-production-xxxx.up.railway.app`)
3. Allez dans l'onglet **"Deployments"**
4. Une fois le déploiement terminé, cliquez sur **"View Logs"**
5. Ouvrez un terminal et exécutez :

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Lier le projet
railway link

# Exécuter les migrations
railway run npx prisma migrate deploy --schema=./backend/prisma/schema.prisma
```

**Alternative sans CLI** : Ajoutez à vos variables d'environnement :
```env
RAILWAY_RUN_BUILD_COMMAND=cd backend && npx prisma migrate deploy
```

### 2.8 Obtenir l'URL Backend

1. Dans Railway, cliquez sur votre service backend
2. Allez dans **"Settings" → "Networking"**
3. Cliquez sur **"Generate Domain"**
4. **Notez** l'URL (ex: `dashboard-backend-production.up.railway.app`)

---

## Partie 3 : Déploiement Frontend sur Vercel

### 3.1 Préparer le Frontend

Créez `vercel.json` à la racine :

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://votre-backend.railway.app/api/:path*"
    }
  ]
}
```

### 3.2 Déployer sur Vercel

#### Option A : Via l'interface Vercel (Recommandé)

1. **Allez sur** https://vercel.com
2. **Cliquez** sur **"Add New..." → "Project"**
3. **Importez** votre repository GitHub
4. **Configurez** le projet :
   - **Framework Preset** : Next.js
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build`
   - **Output Directory** : `.next`

5. **Variables d'environnement** (onglet Environment Variables) :

```env
NEXT_PUBLIC_API_URL=https://votre-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://votre-backend.railway.app
```

6. **Cliquez** sur **"Deploy"**

#### Option B : Via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
cd frontend
vercel

# Production
vercel --prod
```

### 3.3 Obtenir l'URL Frontend

1. Une fois déployé, Vercel vous donnera une URL (ex: `dashboard.vercel.app`)
2. **Notez** cette URL

---

## Partie 4 : Finalisation

### 4.1 Mettre à jour GitHub OAuth

1. Retournez sur https://github.com/settings/developers
2. Éditez votre OAuth App
3. Mettez à jour :
   - **Homepage URL** : `https://votreapp.vercel.app`
   - **Callback URL** : `https://votre-backend.railway.app/api/auth/github/callback`

### 4.2 Mettre à jour les Variables d'Environnement

**Sur Railway (Backend)** :
```env
FRONTEND_URL=https://votreapp.vercel.app
GITHUB_CALLBACK_URL=https://votre-backend.railway.app/api/auth/github/callback
```

**Sur Vercel (Frontend)** :
```env
NEXT_PUBLIC_API_URL=https://votre-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://votre-backend.railway.app
```

### 4.3 Redéployer

- **Railway** : Le redéploiement est automatique après modification des variables
- **Vercel** : Allez dans "Deployments" → "Redeploy"

---

## 🎉 Vérification

### Checklist Post-Déploiement

- [ ] Frontend accessible via Vercel URL
- [ ] Backend accessible via Railway URL
- [ ] API Docs accessibles : `https://votre-backend.railway.app/api/docs`
- [ ] GitHub OAuth fonctionne (bouton "Se connecter avec GitHub")
- [ ] Base de données connectée (vérifier les logs Railway)
- [ ] Redis connecté
- [ ] WebSocket fonctionne (logs en temps réel)

### Tester l'API

```bash
# Health check
curl https://votre-backend.railway.app/api/health

# API Docs
open https://votre-backend.railway.app/api/docs
```

### Tester le Frontend

1. Ouvrez `https://votreapp.vercel.app`
2. Cliquez sur "Se connecter avec GitHub"
3. Autorisez l'application
4. Vous devriez être redirigé vers le dashboard

---

## 🔧 Configuration Avancée

### Domaine Personnalisé

#### Sur Vercel :
1. Allez dans **"Settings" → "Domains"**
2. Ajoutez votre domaine (ex: `dashboard.votredomaine.com`)
3. Configurez les DNS selon les instructions Vercel

#### Sur Railway :
1. Allez dans **"Settings" → "Networking"**
2. Ajoutez un domaine personnalisé (ex: `api.votredomaine.com`)
3. Configurez les DNS :
   ```
   Type: CNAME
   Name: api
   Value: votre-backend.up.railway.app
   ```

### Webhooks Railway

Pour redéployer automatiquement lors d'un push GitHub :

1. Dans Railway, allez dans **"Settings" → "Webhooks"**
2. Copiez l'URL du webhook
3. Sur GitHub, allez dans **"Settings" → "Webhooks"**
4. Ajoutez le webhook Railway

---

## 📊 Monitoring

### Logs Railway

```bash
# Via CLI
railway logs

# Ou dans l'interface Railway → onglet "Observability"
```

### Logs Vercel

```bash
# Via CLI
vercel logs

# Ou dans l'interface Vercel → onglet "Logs"
```

### Métriques

**Railway** :
- CPU, RAM, Network dans l'onglet "Metrics"
- Quotas dans "Usage"

**Vercel** :
- Bandwidth, Build time dans "Analytics"
- Limits dans "Usage"

---

## 💰 Coûts et Limites

### Railway (Plan Trial)

- **5$ gratuits/mois**
- Au-delà : $5/mois par service + usage
- PostgreSQL inclus
- Redis inclus

**Optimisations** :
- Utiliser des instances plus petites
- Mettre le backend en sleep après inactivité (dans Settings)
- Surveiller le dashboard "Usage"

### Vercel (Plan Hobby)

- **Gratuit** pour projets personnels
- 100 GB bandwidth/mois
- Builds illimités

---

## 🐛 Dépannage

### Erreur : "DATABASE_URL not found"

```bash
# Sur Railway, vérifier que PostgreSQL est lié
railway variables

# Relancer le déploiement
railway up
```

### Erreur : "Failed to connect to Redis"

Vérifiez que Redis est bien démarré :
```bash
railway logs --service redis
```

### Erreur 401 sur GitHub OAuth

1. Vérifiez que les URLs dans GitHub OAuth App sont correctes
2. Vérifiez `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET` sur Railway
3. Vérifiez `FRONTEND_URL` sur Railway

### Frontend ne se connecte pas au Backend

1. Vérifiez `NEXT_PUBLIC_API_URL` sur Vercel
2. Vérifiez les CORS dans le backend (logs Railway)
3. Testez l'API directement : `curl https://votre-backend.railway.app/api/health`

### Migrations Prisma échouent

```bash
# Vérifier la connexion DB
railway connect postgres

# Réexécuter les migrations
railway run npx prisma migrate deploy --schema=./backend/prisma/schema.prisma

# Si nécessaire, reset (⚠️ supprime les données)
railway run npx prisma migrate reset --schema=./backend/prisma/schema.prisma
```

---

## 🚀 Déploiement Continu (CI/CD)

### GitHub Actions pour Vercel

Créez `.github/workflows/deploy-frontend.yml` :

```yaml
name: Deploy Frontend to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'
```

### GitHub Actions pour Railway

Railway déploie automatiquement sur push, mais vous pouvez aussi :

```yaml
name: Deploy Backend to Railway

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway
        run: npm i -g @railway/cli
      
      - name: Deploy
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 📚 Ressources

- [Documentation Railway](https://docs.railway.app)
- [Documentation Vercel](https://vercel.com/docs)
- [Guide Prisma + Railway](https://railway.app/template/prisma)
- [Guide Next.js + Vercel](https://vercel.com/docs/frameworks/nextjs)

---

## ✅ Checklist Complète

- [ ] Compte GitHub créé
- [ ] Compte Vercel créé
- [ ] Compte Railway créé
- [ ] Repository GitHub avec le code
- [ ] GitHub OAuth App configurée
- [ ] Backend déployé sur Railway
- [ ] PostgreSQL ajouté sur Railway
- [ ] Redis ajouté sur Railway
- [ ] Variables d'environnement configurées sur Railway
- [ ] Migrations Prisma exécutées
- [ ] Frontend déployé sur Vercel
- [ ] Variables d'environnement configurées sur Vercel
- [ ] URLs mises à jour dans GitHub OAuth
- [ ] URLs mises à jour dans les variables d'environnement
- [ ] Application testée et fonctionnelle

🎊 **Félicitations ! Votre dashboard est en production !**

URLs à partager :
- **Frontend** : https://votreapp.vercel.app
- **API** : https://votre-backend.railway.app
- **API Docs** : https://votre-backend.railway.app/api/docs
