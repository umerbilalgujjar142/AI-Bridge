# ---- build stage: needs devDependencies (nest, typescript) ----
FROM node:24-alpine AS build
WORKDIR /app

# Copy manifests first: this layer is cached until dependencies change.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---- production dependencies only ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- runtime: no sources, no build tools ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# node:alpine ships an unprivileged "node" user — never run as root.
USER node
EXPOSE 3000

# Container Apps probes /health over HTTP, so the image needs no curl.
CMD ["node", "dist/main.js"]
