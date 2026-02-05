# 🏗️ Architecture Technique Détaillée

## Vue d'ensemble

Ce document décrit l'architecture technique complète du dashboard personnel avec gestion des VM.

## Architecture Générale

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 14)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Dashboard  │  │  VM Manager  │  │   Expenses   │          │
│  │    Pages     │  │     Pages    │  │    Pages     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│          │                 │                  │                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │         React Query + Zustand (State)            │          │
│  └──────────────────────────────────────────────────┘          │
│          │                                                       │
│  ┌──────────────────────────────────────────────────┐          │
│  │    API Client (Axios) + WebSocket (Socket.io)    │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                             │
                    HTTP/REST │ WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (NestJS)                            │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │    Auth    │  │   Users    │  │     VM     │  │ Expenses │ │
│  │   Module   │  │   Module   │  │   Module   │  │  Module  │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │   Tasks    │  │  Roadmaps  │  │   Tools    │  │  GitHub  │ │
│  │   Module   │  │   Module   │  │   Module   │  │  Module  │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                VM Provider Services                      │   │
│  │  ┌─────────┐ ┌────────┐ ┌──────┐ ┌──────────┐ ┌──────┐ │   │
│  │  │   AWS   │ │ Azure  │ │ GCP  │ │ Proxmox  │ │VMware│ │   │
│  │  │ Service │ │Service │ │Srvce │ │ Service  │ │Srvce │ │   │
│  │  └─────────┘ └────────┘ └──────┘ └──────────┘ └──────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Core Services                                 │   │
│  │   • Prisma ORM    • Encryption    • WebSocket Gateway   │   │
│  │   • Bull Queue    • JWT Auth      • Validators          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                   │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   PostgreSQL   │  │      Redis      │  │   Bull Queue    │  │
│  │   (Prisma)     │  │  (Cache/Pub)    │  │   (Workers)     │  │
│  └────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
│  ┌───────┐  ┌────────┐  ┌──────┐  ┌─────────┐  ┌─────────────┐│
│  │  AWS  │  │ Azure  │  │ GCP  │  │Proxmox  │  │   GitHub    ││
│  │  EC2  │  │   VM   │  │ CPT  │  │   API   │  │     API     ││
│  └───────┘  └────────┘  └──────┘  └─────────┘  └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Stack Technologique

### Frontend
- **Framework** : Next.js 14 (App Router)
- **UI** : Tailwind CSS + Radix UI
- **State Management** : Zustand + React Query (TanStack Query)
- **HTTP Client** : Axios
- **WebSocket** : Socket.io-client
- **Charts** : Recharts
- **Icons** : Lucide React

### Backend
- **Framework** : NestJS 10
- **Language** : TypeScript
- **ORM** : Prisma
- **Authentication** : Passport (JWT + GitHub OAuth)
- **Validation** : class-validator, class-transformer
- **Queue** : Bull (Redis)
- **WebSocket** : Socket.io
- **Documentation** : Swagger (OpenAPI)

### Infrastructure
- **Database** : PostgreSQL 15
- **Cache/Queue** : Redis 7
- **Containerization** : Docker + Docker Compose

## Modèle de Données (Prisma)

### Entités Principales

#### User
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  username      String?  @unique
  name          String?
  avatar        String?
  githubId      String?  @unique
  role          UserRole @default(USER)
  // Relations
  vms           VM[]
  expenses      Expense[]
  tasks         Task[]
  roadmaps      Roadmap[]
  tools         Tool[]
}
```

#### VM (Machine Virtuelle)
```prisma
model VM {
  id            String     @id @default(uuid())
  name          String
  provider      VMProvider
  status        VMStatus
  ipAddress     String?
  instanceId    String?
  credentials   Json?      // Chiffré AES-256-GCM
  lastMetrics   Json?
  userId        String
  user          User       @relation(fields: [userId], references: [id])
  logs          VMLog[]
}
```

#### Expense, Task, Roadmap, Tool
Voir [backend/prisma/schema.prisma](backend/prisma/schema.prisma) pour les détails complets.

## Flux de Données

### 1. Authentification GitHub OAuth

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│ Frontend │                 │ Backend  │                 │  GitHub  │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │  GET /auth/github          │                            │
     ├───────────────────────────>│                            │
     │                            │  Redirect to GitHub        │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                   User authorizes                       │
     │                            │<───────────────────────────┤
     │                            │  Callback with code        │
     │                            │                            │
     │                            │  Exchange code for token   │
     │                            ├───────────────────────────>│
     │                            │<───────────────────────────┤
     │                            │  Access token              │
     │                            │                            │
     │  Redirect with JWT         │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │  Store token in localStorage                            │
     │                            │                            │
```

### 2. Gestion de VM (Démarrage)

```
┌──────────┐          ┌──────────┐          ┌──────────┐          ┌──────────┐
│ Frontend │          │  Backend │          │   Bull   │          │   AWS    │
│          │          │  API     │          │  Queue   │          │   API    │
└────┬─────┘          └────┬─────┘          └────┬─────┘          └────┬─────┘
     │                     │                     │                     │
     │ POST /vm/:id/start  │                     │                     │
     ├────────────────────>│                     │                     │
     │                     │                     │                     │
     │                     │ Validate & Auth     │                     │
     │                     │                     │                     │
     │                     │ Add job to queue    │                     │
     │                     ├────────────────────>│                     │
     │                     │                     │                     │
     │ 202 Accepted        │                     │                     │
     │<────────────────────┤                     │                     │
     │                     │                     │                     │
     │ WebSocket: STARTING │                     │                     │
     │<────────────────────┤                     │                     │
     │                     │                     │                     │
     │                     │                     │ Process job         │
     │                     │                     │                     │
     │                     │                     │ Start instance      │
     │                     │                     ├────────────────────>│
     │                     │                     │                     │
     │                     │                     │ Instance starting   │
     │                     │                     │<────────────────────┤
     │                     │                     │                     │
     │                     │ Update status       │                     │
     │                     │<────────────────────┤                     │
     │                     │                     │                     │
     │ WebSocket: RUNNING  │                     │                     │
     │<────────────────────┤                     │                     │
     │                     │                     │                     │
```

### 3. WebSocket en Temps Réel

Le frontend se connecte au namespace WebSocket `/vm` :

```typescript
// Frontend
const socket = io('ws://localhost:3001/vm', {
  auth: { token: accessToken }
});

socket.on('connect', () => {
  // S'abonner aux mises à jour d'une VM
  socket.emit('subscribe-vm', vmId);
});

socket.on('vm-status-update', ({ vmId, status }) => {
  // Mettre à jour l'UI
});

socket.on('vm-metrics-update', ({ vmId, metrics }) => {
  // Afficher les métriques
});
```

## Sécurité

### 1. Chiffrement des Credentials VM

```typescript
// backend/src/encryption/encryption.service.ts
class EncryptionService {
  encrypt(text: string): string {
    // AES-256-GCM avec IV aléatoire
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    // ... encryption logic
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
}
```

**Stockage** :
- Credentials chiffrés dans la colonne `credentials` (JSON)
- Clé de chiffrement en variable d'environnement (`ENCRYPTION_KEY`)
- Jamais exposés au frontend

### 2. Authentification JWT

```typescript
// Guards NestJS
@UseGuards(AuthGuard('jwt'))
@Controller('vm')
export class VmController {
  // Routes protégées
}
```

### 3. Validation des Entrées

```typescript
// DTOs avec class-validator
export class CreateVmDto {
  @IsString()
  @Length(3, 50)
  name: string;
  
  @IsEnum(VMProvider)
  provider: VMProvider;
  // ...
}
```

## Performance

### 1. Cache Redis

- Sessions utilisateur
- Résultats de requêtes fréquentes
- Rate limiting

### 2. Queue Bull

- Opérations longues (start/stop VM)
- Jobs asynchrones
- Retry automatique

### 3. React Query

- Cache côté client
- Invalidation automatique
- Optimistic updates

## Évolutivité

### Scalabilité Horizontale

```yaml
# docker-compose.yml pour production
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
  
  postgres:
    deploy:
      replicas: 1  # Primary + replicas read-only
  
  redis:
    deploy:
      replicas: 3  # Redis Cluster
```

### Load Balancing

```nginx
upstream backend {
  server backend-1:3001;
  server backend-2:3001;
  server backend-3:3001;
}
```

## Monitoring

### Métriques à surveiller

1. **Backend**
   - Temps de réponse API
   - Taux d'erreur
   - Connexions WebSocket actives
   - Jobs Bull en attente

2. **Base de données**
   - Connexions actives
   - Temps de requête
   - Taille de la DB

3. **VM**
   - Nombre de VM par statut
   - Temps de démarrage/arrêt
   - Erreurs d'API provider

### Outils recommandés

- **APM** : New Relic, Datadog
- **Logs** : ELK Stack, Loki
- **Métriques** : Prometheus + Grafana
- **Uptime** : Pingdom, UptimeRobot

## Tests

### Structure de tests

```
backend/
├── src/
│   └── vm/
│       ├── vm.service.spec.ts
│       ├── vm.controller.spec.ts
│       └── providers/
│           ├── aws.service.spec.ts
│           └── proxmox.service.spec.ts
```

### Commandes

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Coverage
npm run test:cov
```

## CI/CD Pipeline Suggéré

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test
      - name: Build
        run: |
          cd backend && npm run build
          cd ../frontend && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          # Commandes de déploiement
```

## Bonnes Pratiques

1. **Code Organization** : Architecture modulaire
2. **Type Safety** : TypeScript strict mode
3. **Error Handling** : Try/catch + error interceptors
4. **Logging** : Structured logging (Winston)
5. **Documentation** : Swagger + code comments
6. **Git** : Conventional commits
7. **Review** : Pull requests obligatoires

---

Pour plus d'informations, consulter les fichiers sources dans `/backend` et `/frontend`.
