# ZapAuto (WhatsApp MRP Bot)

Projeto monorepo com:

- **API** (Express) em `artifacts/api-server`
- **Dashboard** (React + Vite) em `artifacts/dashboard`

## Como rodar localmente

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```
2. Ajuste as variáveis em `.env` (PORT, DATABASE_URL, WHATSAPP_*, etc).
3. Instale dependências:
   ```bash
   pnpm install
   ```
4. Rode a API:
   ```bash
   pnpm start
   ```

5. (Opcional) Rode o dashboard:
   ```bash
   pnpm start:dashboard
   ```

## Deploy (Railway / VPS)

### Railway (Git-based)

1. Crie um repositório no GitHub.
2. Adicione a remote ao seu clone e envie:
   ```bash
   git remote add origin https://github.com/<seu-usuario>/<seu-repo>.git
   git push -u origin master
   ```
3. No Railway, conecte o repositório e configure as variáveis de ambiente com base em `.env.example`.

### Deploy com Docker

1. Construir imagem:
   ```bash
   pnpm deploy:docker
   ```
2. Rodar:
   ```bash
   docker run -p 3000:3000 --env-file .env zapauto
   ```

## Estrutura principal

- `artifacts/api-server` — código do servidor de API
- `artifacts/dashboard` — frontend React
- `lib/api-zod` — schemas Zod usados pelo backend/frontend
