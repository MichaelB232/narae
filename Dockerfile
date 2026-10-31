# Build context HARUS folder root project (lihat docker-compose.yml: context: .)
# karena backend bergantung ke paket lokal ../agent.
FROM node:20-alpine AS build
WORKDIR /app

# 1) build @narae/agent dulu
COPY agent/package.json agent/tsconfig.json ./agent/
WORKDIR /app/agent
RUN npm install
COPY agent/src ./src
RUN npm run build

# 2) build backend — package.json-nya mereferensikan "file:../agent"
WORKDIR /app/backend
COPY backend/package.json backend/tsconfig.json ./
RUN npm install
COPY backend/src ./src
RUN npm run build

# 3) image final
# PENTING: npm menginstall dependency "file:../agent" sebagai SYMLINK di
# backend/node_modules/@narae/agent -> ../../agent (bukan copy isinya). Kalau /app/agent
# tidak ikut dibawa ke image final, symlink itu nunjuk ke folder yang tidak ada ->
# ERR_MODULE_NOT_FOUND saat runtime. Jadi /app/agent WAJIB ikut di-copy, dengan path yang
# sama persis (/app/agent), supaya symlink relatifnya tetap valid.
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/agent ./agent
WORKDIR /app/backend
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
