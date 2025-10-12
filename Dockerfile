# Estágio de build do frontend
FROM node:20-slim AS builder

WORKDIR /app

# Permitir configurar base da API no build do frontend
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Instalar ferramentas de build necessárias (alguns módulos nativos podem precisar)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências (inclui dev para build)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código e construir frontend
COPY . .
RUN npm run build


# Estágio de runtime (API + servir frontend)
FROM node:20-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV PUBLIC_DIR=/app/public

# Instalar ferramentas de build (caso módulos nativos precisem compilar em runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Instalar somente dependências de produção
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiar código da aplicação e o build do frontend
COPY . .
COPY --from=builder /app/dist ./dist

# Garantir pastas de upload estático
RUN mkdir -p public/logos public/produtos

# Expor porta HTTP
EXPOSE 3001

# Definir volume para uploads persistentes
VOLUME [ "/app/public" ]

# Healthcheck para Easypanel
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get({host:'localhost',port:process.env.PORT||3001,path:'/health'},r=>{if(r.statusCode===200)process.exit(0);else process.exit(1)}).on('error',()=>process.exit(1))"

# Comando de inicialização (Express API)
CMD ["node", "server/api.js"]