# Estágio de build do frontend
FROM node:20-slim AS builder

# Instalar ferramentas de build necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependências (inclui dev para build)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código e construir frontend
COPY . .
RUN npm run build

# Estágio de runtime (API)
FROM node:20-slim AS runtime

# Instalar ferramentas de build necessárias para alguns módulos nativos (ex.: sqlite3/bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
ENV NODE_ENV=production
ENV PORT=3001
RUN npm ci --omit=dev

COPY . .

# Copiar build do frontend do estágio builder
COPY --from=builder /app/dist ./dist

# Garantir pastas de upload estático
RUN mkdir -p public/logos public/produtos

EXPOSE 3001

# Definir volume para uploads persistentes
VOLUME [ "/app/public" ]

# Healthcheck para EasyPanel
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get({host:'localhost',port:process.env.PORT||3001,path:'/health'},r=>{if(r.statusCode===200)process.exit(0);else process.exit(1)}).on('error',()=>process.exit(1))"

# Comando de inicialização (Express API)
CMD ["node", "server/api.js"]