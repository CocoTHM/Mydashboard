# ⚡ Déploiement Ultra-Rapide (5 minutes)

Guide condensé pour déployer sur Vercel + Railway.

## 🎯 Étape 1 : GitHub OAuth (2 min)

1. https://github.com/settings/developers → **New OAuth App**
2. Remplir :
   - Homepage: `https://temp.vercel.app`
   - Callback: `https://temp.railway.app/api/auth/github/callback`
3. **Noter** Client ID + Client Secret

## 🚂 Étape 2 : Railway Backend (5 min)

### 2.1 Créer le projet
```bash
# Installer Railway CLI
npm i -g @railway/cli

# Login
railway login

# Créer projet
railway init
```

### 2.2 Ajouter services
Dans Railway Dashboard :
1. **+ New** → Database → **PostgreSQL**
2. **+ New** → Database → **Redis**
3. **+ New** → GitHub Repo → Sélectionner votre repo

### 2.3 Variables (copier-coller)
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
JWT_SECRET=$(openssl rand -base64 48)
ENCRYPTION_KEY=$(openssl rand -base64 32 | head -c 32)
GITHUB_CLIENT_ID=votre-id
GITHUB_CLIENT_SECRET=votre-secret
GITHUB_CALLBACK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/api/auth/github/callback
FRONTEND_URL=https://temp.vercel.app
```

### 2.4 Migrations
```bash
railway link
railway run npx prisma migrate deploy --schema=./backend/prisma/schema.prisma
```

### 2.5 Noter l'URL
Settings → Networking → **Generate Domain** → Noter l'URL

## 🔺 Étape 3 : Vercel Frontend (3 min)

### 3.1 Déployer
```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Déployer
cd frontend
vercel --prod
```

### 3.2 Variables
Dans Vercel Dashboard → Settings → Environment Variables :
```
NEXT_PUBLIC_API_URL=https://votre-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://votre-backend.railway.app
```

### 3.3 Redéployer
```bash
vercel --prod
```

## ✅ Étape 4 : Finaliser (2 min)

### 4.1 Mettre à jour GitHub OAuth
1. https://github.com/settings/developers
2. Éditer votre app
3. Mettre les vraies URLs :
   - Homepage: `https://votre-app.vercel.app`
   - Callback: `https://votre-backend.railway.app/api/auth/github/callback`

### 4.2 Mettre à jour Railway
```bash
FRONTEND_URL=https://votre-app.vercel.app
GITHUB_CALLBACK_URL=https://votre-backend.railway.app/api/auth/github/callback
```

## 🎉 Terminé !

✅ Frontend : https://votre-app.vercel.app
✅ Backend : https://votre-backend.railway.app
✅ API Docs : https://votre-backend.railway.app/api/docs

---

## 🐛 Problème ?

**Backend ne démarre pas**
```bash
railway logs
```

**Frontend erreur 500**
```bash
vercel logs
```

**OAuth ne marche pas**
- Vérifier les URLs dans GitHub OAuth App
- Vérifier GITHUB_CLIENT_ID/SECRET sur Railway

**Base de données vide**
```bash
railway run npx prisma migrate deploy --schema=./backend/prisma/schema.prisma
```

---

## 📖 Guide Complet

Pour plus de détails → [VERCEL_RAILWAY.md](VERCEL_RAILWAY.md)
