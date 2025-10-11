# Guia de Deploy com Docker

Este documento descreve como construir a imagem, executar localmente com Docker e configurar o deploy no Easypanel usando o `Dockerfile` do projeto.

## Visão Geral

- Backend Express roda na porta `3001` e serve o build do frontend (`dist`).
- Uploads de imagens são gravados em `PUBLIC_DIR` (por padrão `/app/public` dentro do container), com subpastas:
  - `logos`: acessível via `/logos/...`
  - `produtos`: acessível via `/produtos/...`
- É necessário volume persistente montado em `/app/public` para não perder uploads entre recriações de container.
- O frontend consome a API via `VITE_API_BASE_URL` (variável de build do Vite).

## Build da Imagem

O `Dockerfile` usa build multi-stage. Para garantir que o frontend aponte para a API correta, defina `VITE_API_BASE_URL` em tempo de build.

```
# Na raiz do projeto
docker build \
  --build-arg VITE_API_BASE_URL=/api \
  -t tabela:latest .
```

- Use `VITE_API_BASE_URL=/api` quando frontend e backend estiverem no mesmo domínio (caso típico no Easypanel).
- Se backend estiver em outro host, use a URL completa (ex.: `https://seu-dominio/api`).

## Execução Local com Docker

```
docker run --rm \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e PUBLIC_DIR=/app/public \
  -e JWT_SECRET=troque_por_um_segredo \
  -e DATABASE_URL=postgres://usuario:senha@host:porta/banco?sslmode=disable \
  -v /caminho/no/host/public:/app/public \
  tabela:latest
```

- Acesse `http://localhost:3001/` para a aplicação.
- Uploads ficarão em `/caminho/no/host/public/logos` e `/caminho/no/host/public/produtos`.

## Deploy no Easypanel

1. Build:
   - Selecione Dockerfile da raiz.
   - Passe `--build-arg VITE_API_BASE_URL=/api` no passo de build.
2. Variáveis de Ambiente (Container):
   - `NODE_ENV=production`
   - `PORT=3001`
   - `PUBLIC_DIR=/app/public`
   - `JWT_SECRET=defina_um_segredo`
   - `DATABASE_URL=postgres://usuario:senha@host:porta/banco?sslmode=disable`
3. Volumes:
   - Monte um volume persistente do host para `/app/public` (ex.: host path `/var/data/tabela-public` → container path `/app/public`).
4. Rede/Proxy:
   - Aponte o domínio para o container na porta `3001`.
   - Garanta que os caminhos `/api/*`, `/logos/*` e `/produtos/*` sejam servidos pelo container (não interceptar por fallback de SPA no proxy).
5. Healthcheck:
   - O Dockerfile já define um healthcheck em `/health`.

### Notas importantes

- `VITE_API_BASE_URL` é avaliada em tempo de build do frontend (Vite). Alterar essa env somente no runtime não muda o arquivo `dist`. Se precisar mudar, recompile a imagem com o `--build-arg` correto.
- `PUBLIC_DIR` é lida em runtime pelo backend. Ajuste essa env e o volume conforme seu ambiente.
- Limite de upload: atualmente `5MB` via `multer`. Se o proxy tiver limite menor, aumente (ex.: `client_max_body_size` no Nginx).

## Testes Pós-Deploy

- Acesse `/health` para validar o backend: `https://seu-dominio/health`.
- Faça upload de uma logo na aba Admin → Marcas.
  - Verifique se a resposta retorna `logo_url: /logos/logo-<timestamp>.png`.
  - Abra a URL completa no navegador (`https://seu-dominio/logos/logo-...`).
- Faça upload de imagem de produto na aba Admin → Produtos.
  - Verifique `imagem_url: /produtos/produto-<timestamp>.png` e abra a URL.

## Problemas Comuns

- 404 ao acessar `/logos/...` ou `/produtos/...`:
  - Proxy não roteando esses caminhos para o container. Ajuste regras/rotas.
- Upload não grava arquivo:
  - Verifique permissões do volume montado e se o caminho de `PUBLIC_DIR` aponta para `/app/public`.
  - Confira logs do container para mensagens como `Diretórios de upload prontos: { LOGOS_DIR, PRODUTOS_DIR }`.
- Frontend apontando para `http://localhost:3001/api` em produção:
  - Faltou definir `VITE_API_BASE_URL` no build. Recompile a imagem com `--build-arg VITE_API_BASE_URL=/api`.

## Variáveis de Ambiente

- `NODE_ENV`: `production` recomendado em deploy.
- `PORT`: porta do backend (default `3001`).
- `PUBLIC_DIR`: diretório raiz para uploads (default `/app/public`).
- `JWT_SECRET`: segredo para autenticação admin.
- `DATABASE_URL`: string de conexão Postgres (o backend usa `process.env.DATABASE_URL`).
- `VITE_API_BASE_URL` (build): base da API para o frontend.