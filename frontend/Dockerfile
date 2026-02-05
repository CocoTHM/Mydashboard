FROM node:18-alpine AS base

WORKDIR /app

# Dépendances
COPY package*.json ./
RUN npm ci

# Copier le code
COPY . .

# Build (désactivé en dev, utilisé seulement en prod)
# RUN npm run build

# Exposer le port
EXPOSE 3000

# Commande de dev
CMD ["npm", "run", "dev"]
