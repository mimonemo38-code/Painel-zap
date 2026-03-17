# ZapAuto MRP Bot

## Overview

ZapAuto is a WhatsApp MRP (Manufacturing Resource Planning) Bot with a management dashboard. It connects to WhatsApp via the Baileys WebSocket library (no Puppeteer/browser required) and responds automatically to messages from whitelisted contacts.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **WhatsApp**: @whiskeysockets/baileys (WebSocket-based, no Puppeteer)
- **Frontend**: React + Vite + Tailwind CSS
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (WhatsApp bot, backend)
│   └── dashboard/          # React dashboard frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
└── ...
```

## Key Files

- `artifacts/api-server/src/lib/whatsapp.ts` — Baileys WhatsApp singleton client
- `artifacts/api-server/src/routes/whatsapp.ts` — WhatsApp connection endpoints
- `artifacts/api-server/src/routes/whitelist.ts` — Contact whitelist management
- `artifacts/api-server/src/routes/history.ts` — Query history
- `artifacts/api-server/src/routes/config.ts` — System configuration
- `lib/db/src/schema/whitelist.ts` — Whitelist table
- `lib/db/src/schema/history.ts` — Query history table
- `lib/db/src/schema/config.ts` — Config key-value table

## Features

1. **Dashboard** — Overview with stats cards and recent activity log
2. **WhatsApp** — QR code scan to connect, connection status, auto-reconnect
3. **Whitelist** — Manage which phone numbers the bot responds to
4. **History** — View all messages processed by the bot
5. **Settings** — Configure auto-respond, welcome message, daily limits

## API Endpoints

- `GET /api/healthz` — Health check
- `GET /api/whatsapp/status` — Connection status
- `GET /api/whatsapp/qr` — QR code as base64 PNG
- `POST /api/whatsapp/connect` — Start WhatsApp connection
- `POST /api/whatsapp/disconnect` — Disconnect
- `GET /api/whitelist` — List contacts
- `POST /api/whitelist` — Add contact
- `PATCH /api/whitelist/:id` — Update contact
- `DELETE /api/whitelist/:id` — Remove contact
- `GET /api/history` — Message history
- `GET /api/config` — Get config
- `PUT /api/config` — Update config

## Baileys Auth

Baileys stores session credentials in `.baileys_auth/` directory. After scanning the QR code once, the session persists across restarts.

## DB Schema

- `whitelist` — Phone numbers allowed to interact with the bot
- `query_history` — Log of all messages processed
- `system_config` — Key-value configuration store
