# 🚀 Dashboard Personnel - Gestion Complète et VM

Dashboard web modulaire, sécurisé et orienté productivité pour gérer vos outils personnels, techniques et machines virtuelles.

## 📋 Fonctionnalités

### 🎯 Core
- **Tableau de bord principal** avec widgets configurables
- **Authentification** OAuth GitHub + JWT
- **Architecture modulaire** et scalable

### 💰 Gestion Financière
- CRUD des dépenses
- Catégorisation et filtrage
- Graphiques mensuels et annuels
- Export des données

### ✅ Gestion des Tâches
- CRUD des tâches avec priorités
- Statuts et deadlines
- Vue Kanban et filtres
- Notifications

### 🗺️ Roadmaps
- Roadmaps multi-domaines (dev, perso, business)
- Étapes avec progression
- Visualisation de l'avancement
- Suivi temporel

### 🐙 Intégration GitHub
- Liste des repositories
- GitHub Actions (statut + déclenchement)
- Statistiques d'activité
- Webhooks pour notifications

### 🛠️ Gestionnaire d'Outils
- Ajout d'outils personnalisés
- Types : logiciel, site web, service cloud, VM
- Catégorisation et favoris
- Accès direct depuis le dashboard

### 🖥️ Gestion des VM (Fonctionnalité Phare)
#### Providers supportés
- **Local** : Proxmox, VMware, VirtualBox
- **Cloud** : AWS EC2, Azure VM, GCP Compute Engine

#### Fonctionnalités VM
- ✅ Enregistrement des VM (nom, IP, OS, tags, état)
- ⚡ Actions : Start / Stop / Restart
- 🔌 Accès rapide : SSH, RDP, VNC
- 📊 Métriques : CPU, RAM, Disque
- 📝 Logs d'état en temps réel
- 🔐 Stockage chiffré des credentials
- 🔒 Permissions par VM et utilisateur
- 🌐 WebSocket pour statut temps réel

## 🏗️ Architecture

```
dashboard/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/           # JWT + GitHub OAuth
│   │   ├── users/          # Gestion utilisateurs
│   │   ├── expenses/       # Module dépenses
│   │   ├── tasks/          # Module tâches
│   │   ├── roadmaps/       # Module roadmaps
│   │   ├── github/         # Intégration GitHub
│   │   ├── tools/          # Gestionnaire d'outils
│   │   ├── vm/             # Gestion des VM
│   │   │   ├── providers/  # Services par provider
│   │   │   │   ├── aws.service.ts
│   │   │   │   ├── azure.service.ts
│   │   │   │   ├── gcp.service.ts
│   │   │   │   ├── proxmox.service.ts
│   │   │   │   └── vmware.service.ts
│   │   │   ├── vm.controller.ts
│   │   │   ├── vm.service.ts
│   │   │   ├── vm.gateway.ts   # WebSocket
│   │   │   └── vm.worker.ts    # Background jobs
│   │   ├── encryption/     # Service de chiffrement
│   │   ├── database/       # Prisma client
│   │   └── common/         # Utilities, guards, decorators
│   ├── prisma/
│   │   └── schema.prisma   # Modèles de données
│   └── Dockerfile
│
├── frontend/               # Next.js + Tailwind
│   ├── src/
│   │   ├── app/           # App Router
│   │   │   ├── dashboard/
│   │   │   ├── expenses/
│   │   │   ├── tasks/
│   │   │   ├── roadmaps/
│   │   │   ├── github/
│   │   │   ├── tools/
│   │   │   └── vm/        # UI gestion VM
│   │   ├── components/    # Composants réutilisables
│   │   │   ├── ui/        # Composants UI de base
│   │   │   ├── widgets/   # Widgets dashboard
│   │   │   └── vm/        # Composants VM
│   │   ├── lib/          # Utilities, API client
│   │   ├── hooks/        # Custom hooks
│   │   └── types/        # TypeScript types
│   └── Dockerfile
│
└── docker-compose.yml     # Orchestration
```

## 🛠️ Stack Technique

### Backend
- **Framework** : NestJS
- **Base de données** : PostgreSQL + Prisma ORM
- **Cache/Queue** : Redis + Bull
- **WebSocket** : Socket.io
- **Sécurité** : Passport, JWT, Crypto (chiffrement credentials)

### Frontend
- **Framework** : Next.js 14 (App Router)
- **UI** : Tailwind CSS + shadcn/ui
- **État** : Zustand / React Query
- **WebSocket** : socket.io-client
- **Charts** : Recharts / Chart.js

### DevOps
- **Conteneurisation** : Docker + Docker Compose
- **CI/CD** : GitHub Actions (à configurer)

## 🚀 Installation

### Prérequis
- Node.js 18+
- Docker & Docker Compose
- Git

### Étapes

1. **Cloner le projet**
```bash
git clone <repo-url>
cd "My dashboard"
```

2. **Configuration**
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

3. **Lancer avec Docker**
```bash
docker-compose up -d
```

4. **Migrations de base de données**
```bash
docker exec -it dashboard-backend npx prisma migrate dev
```

5. **Accéder à l'application**
- Frontend : http://localhost:3000
- Backend : http://localhost:3001
- API Docs : http://localhost:3001/api/docs

## 📦 Installation Locale (Sans Docker)

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Sécurité

### Credentials VM
- Chiffrement AES-256-GCM des credentials
- Clés stockées uniquement en backend
- Aucune exposition côté frontend
- Permissions granulaires par VM

### Authentification
- OAuth GitHub
- JWT avec refresh tokens
- HTTPS obligatoire en production
- Rate limiting sur les endpoints sensibles

### Best Practices
- Variables d'environnement pour secrets
- Validation des inputs (class-validator)
- CORS configuré
- Helmet.js pour headers de sécurité

## 📊 Modèle de Données

### VM Management
```prisma
model VM {
  id          String   @id @default(uuid())
  name        String
  provider    Provider
  status      VMStatus
  ipAddress   String?
  os          String?
  tags        String[]
  credentials Json?    // Chiffré
  metrics     Json?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Provider {
  AWS_EC2
  AZURE_VM
  GCP_COMPUTE
  PROXMOX
  VMWARE
  VIRTUALBOX
}

enum VMStatus {
  RUNNING
  STOPPED
  PENDING
  ERROR
}
```

## 🎨 Exemples d'Usage

### API - Démarrer une VM
```bash
POST /api/vm/:id/start
Authorization: Bearer <token>
```

### Frontend - Composant VM Card
```tsx
<VMCard
  vm={vm}
  onStart={() => handleStartVM(vm.id)}
  onStop={() => handleStopVM(vm.id)}
  onConnect={() => handleSSH(vm)}
/>
```

## 🔧 Configuration Providers

### AWS EC2
```env
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
```

### Proxmox
```typescript
// Enregistrer via l'UI avec :
{
  host: "proxmox.local",
  port: 8006,
  username: "root@pam",
  password: "encrypted"
}
```

## 📈 Roadmap

- [ ] Support Kubernetes
- [ ] Monitoring avancé (Prometheus/Grafana)
- [ ] Notifications push
- [ ] Mobile app (React Native)
- [ ] IA pour prédictions de coûts
- [ ] Backup automatique des VM

## 🤝 Contribution

Contributions bienvenues ! Ouvrez une issue ou pull request.

## 📄 Licence

MIT

## 👤 Auteur

Dashboard créé pour une gestion centralisée et efficace de votre écosystème personnel et technique.
