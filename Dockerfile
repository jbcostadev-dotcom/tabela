# Base: Node.js para produção
FROM node:20-slim AS runtime

# Instalar ferramentas de build necessárias para alguns módulos nativos (ex.: sqlite3/bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar manifestos e instalar dependências de produção
COPY package.json package-lock.json ./
ENV NODE_ENV=production
RUN npm ci --omit=dev

# Copiar código da aplicação
COPY . .

# Garantir pastas de upload estático
RUN mkdir -p public/logos public/produtos

# Porta da API
ENV PORT=3001
EXPOSE 3001

# Comando de inicialização (Express API)
CMD ["node", "server/api.js"]