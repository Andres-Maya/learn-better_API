# syntax=docker/dockerfile:1

# ---- Etapa 1: compila TypeScript con todas las dependencias ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ---- Etapa 2: imagen final, solo dependencias de producción ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# No correr como root dentro del contenedor.
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/health" > /dev/null || exit 1

# Aplica las migraciones pendientes y luego arranca la API.
CMD ["sh", "-c", "npx typeorm migration:run -d dist/database/data-source.js && node dist/main"]
