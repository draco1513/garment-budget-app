# ============================================================
#  Dockerfile — Frontend Angular + Ionic
#  Stage 1: Build Angular con Node
#  Stage 2: Nginx para servir archivos estáticos
# ============================================================

# ── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias (cache de Docker)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copiar fuentes y compilar
COPY . .
RUN npm run build

# ── Stage 2: Nginx ───────────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

# Remover config por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Config personalizada para Angular SPA
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Archivos compilados
COPY --from=builder /app/dist/garment-budget-app /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -q --spider http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
