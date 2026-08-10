# Happy Melon

Monorepo [Turborepo](https://turborepo.dev) com:

| App / pacote | Descrição |
| --- | --- |
| `apps/api` | API NestJS (Fastify) + Better Auth — porta `3000` |
| `apps/web` | Frontend Next.js — porta `3001` |
| `packages/database` | Prisma (PostgreSQL) |
| `packages/shared` | Tipos/utilitários compartilhados |

## Pré-requisitos

- **Node.js** 18+ (recomendado 22)
- **pnpm** via Corepack (`corepack enable`)
- **Docker** + Docker Compose (banco e/ou stack completa)

## Configuração rápida (Docker — recomendado para deploy)

1. Copie o arquivo de ambiente da raiz:

```bash
cp .env.example .env
```

2. Edite o `.env`:

- Defina `POSTGRES_PASSWORD` e um `BETTER_AUTH_SECRET` forte (`openssl rand -base64 32`)
- Ajuste `DATABASE_URL` para usar a mesma senha (host `postgres` dentro do Compose)
- Em produção, aponte `BETTER_AUTH_URL`, `WEB_ORIGIN` e `NEXT_PUBLIC_API_URL` para as URLs públicas (HTTPS)

3. Suba a stack (Postgres + API + Web):

```bash
docker compose up -d --build
```

- Web: [http://localhost:3001](http://localhost:3001)
- API: [http://localhost:3000](http://localhost:3000)
- Postgres: `localhost:5432` (senha do `.env`)

Na subida, a API aplica as migrations (`prisma migrate deploy`) automaticamente.

> **Senha do Postgres:** `POSTGRES_PASSWORD` só vale na **primeira** criação do volume. Se mudar a senha no `.env` depois, ou alinhe `DATABASE_URL` à senha antiga, ou recrie o volume com `docker compose down -v` (apaga os dados).

### Seed do primeiro admin

Com a stack no ar e `ADMIN_EMAIL` / `ADMIN_PASSWORD` preenchidos no `.env`:

```bash
# recomendado (não usa Corepack/pnpm)
docker compose exec api /app/apps/api/docker-seed-admin.sh

# alternativa
docker compose exec -u root api pnpm --filter api seed:admin
```

Se a imagem for antiga e o seed script ainda não existir:

```bash
docker compose build api && docker compose up -d api
docker compose exec api /app/apps/api/docker-seed-admin.sh
```

### Comandos úteis

```bash
docker compose logs -f api web
docker compose ps
docker compose down          # para containers (mantém volume do banco)
docker compose down -v       # apaga também os dados do Postgres
```

### Mudou a URL pública da API?

`NEXT_PUBLIC_API_URL` é embutida no build do Next. Depois de alterar no `.env`:

```bash
docker compose build --no-cache web
docker compose up -d web
```

Atualize também `BETTER_AUTH_URL` e `WEB_ORIGIN` no `.env` e reinicie a API (`docker compose up -d api`).

## Desenvolvimento local (hot reload)

Use o Compose só para o banco e rode API/Web no host.

1. Suba o Postgres:

```bash
cp .env.example .env
# No .env de desenvolvimento, use localhost na DATABASE_URL:
# DATABASE_URL=postgresql://postgres:change-me@localhost:5432/hm-db
docker compose up -d postgres
```

2. Configure os envs dos apps (além do `.env` da raiz, se quiser):

```bash
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Preencha `DATABASE_URL` (host `localhost`), `BETTER_AUTH_*`, `WEB_ORIGIN` e `NEXT_PUBLIC_API_URL`.

3. Instale e rode:

```bash
corepack enable
pnpm install
pnpm db:migrate
pnpm dev
```

- API: [http://localhost:3000](http://localhost:3000)
- Web: [http://localhost:3001](http://localhost:3001)

Scripts úteis na raiz: `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm db:studio`.

## Deploy em VPS

O mesmo `docker-compose.yml` serve para produção.

1. Clone o repositório na VPS e crie o `.env` a partir de `.env.example`.
2. Use senhas/secrets fortes e URLs públicas, por exemplo:

```env
BETTER_AUTH_URL=https://api.seudominio.com
WEB_ORIGIN=https://seudominio.com
NEXT_PUBLIC_API_URL=https://api.seudominio.com
DATABASE_URL=postgresql://postgres:SENHA_FORTE@postgres:5432/hm-db
```

3. Build e suba:

```bash
docker compose up -d --build
```

4. Coloque um reverse proxy (Caddy ou Nginx) na frente das portas `3000`/`3001` com TLS. Os containers já escutam em `0.0.0.0`.

5. Dados do Postgres ficam no volume Docker `pgdata` — faça backup desse volume.

6. Após o primeiro deploy, rode o seed do admin (seção acima).

### Checklist de produção

- [ ] `BETTER_AUTH_SECRET` único e longo
- [ ] `POSTGRES_PASSWORD` forte; `DATABASE_URL` coerente
- [ ] URLs HTTPS alinhadas em `BETTER_AUTH_URL`, `WEB_ORIGIN` e `NEXT_PUBLIC_API_URL`
- [ ] Rebuild do serviço `web` se `NEXT_PUBLIC_API_URL` mudar
- [ ] Proxy reverso + firewall (expor só 80/443)
- [ ] Backup do volume `pgdata`

## Estrutura

```text
.
├── apps
│   ├── api          # NestJS
│   └── web          # Next.js
├── packages
│   ├── database     # Prisma + PostgreSQL
│   ├── shared
│   ├── eslint-config
│   ├── jest-config
│   └── typescript-config
├── docker-compose.yml
├── .env.example
└── package.json
```

## Variáveis de ambiente

| Variável | Serviço | Quando |
| --- | --- | --- |
| `POSTGRES_USER` / `PASSWORD` / `DB` | postgres | runtime |
| `DATABASE_URL` | api (+ migrate) | runtime |
| `BETTER_AUTH_SECRET` | api | runtime |
| `BETTER_AUTH_URL` | api | runtime |
| `WEB_ORIGIN` | api (CORS / Auth) | runtime |
| `NEXT_PUBLIC_API_URL` | web (browser) | **build** (ARG) |
| `INTERNAL_API_URL` | web (servidor Next → API) | runtime no Compose (`http://api:3000`) |
| `ADMIN_EMAIL` / `PASSWORD` / `NAME` | api | seed manual |

Os `.env.example` em `apps/*` e `packages/database` cobrem o fluxo de desenvolvimento no host.
