# ── Build Stage ──────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependencias del sistema para mssql/native modules
RUN apk add --no-cache python3 make g++ libc6-compat

COPY package*.json ./
RUN npm ci --include=dev

COPY . .

# Build del admin panel de Strapi
RUN npm run build

# ── Production Stage ─────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

# Dependencias del sistema mínimas para mssql
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar artefactos del build
COPY --from=builder /app/build ./build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/config ./config

# Crear directorio de uploads
RUN mkdir -p public/uploads && chmod 755 public/uploads

# Usuario no-root por seguridad
RUN addgroup -S strapi && adduser -S strapi -G strapi
RUN chown -R strapi:strapi /app
USER strapi

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:1337/admin', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["node_modules/.bin/strapi", "start"]
