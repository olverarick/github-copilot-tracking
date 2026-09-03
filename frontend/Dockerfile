# ── Etapa 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Se copia también package-lock.json y se usa `npm ci` en lugar de
# `npm install`. Sin el lock, npm resuelve los rangos "^" a la última
# versión publicada, lo que hace el build no reproducible: el contenedor
# instalaba @xyflow/react 12.11.4, que importa `handleAttributionWarning`
# de @xyflow/system 0.0.80 — versión que no exporta esa función (publish
# roto upstream). `npm ci` respeta el lock y fija 12.11.3, que sí es
# consistente con 0.0.80.
COPY package.json package-lock.json ./
RUN npm ci

# Permite invalidar el cache de capas sin tocar el código fuente
ARG CACHEBUST=1
COPY . .

RUN npm run build

# ── Etapa 2: Runtime ──────────────────────────────────────────────────────────
# nginx-unprivileged: corre como usuario 'nginx' (uid 101), escucha en 8080.
# No requiere CAP_NET_BIND_SERVICE — compatible con Podman rootless sin ajustes.
FROM nginxinc/nginx-unprivileged:alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
