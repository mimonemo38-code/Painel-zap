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

### Railway (recomendado)

1. No Railway, crie um novo projeto e conecte ao repositório GitHub: `mimonemo38-code/Painel-zap`.
2. Defina as variáveis de ambiente usando `.env.example` como referência.
3. Na configuração do projeto, certifique-se de que o comando de execução seja:
   ```bash
   pnpm start
   ```

> Se o Railway não instalar dependências automaticamente com `pnpm`, force o uso de `pnpm` em:
> - Build command: `pnpm install && pnpm start`

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
