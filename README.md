<h1 align="center">
  <img src="apps/web/public/logo-texto.svg" alt="Happy Melon" width="420" />
</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  &nbsp;
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  &nbsp;
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  &nbsp;
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  &nbsp;
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  &nbsp;
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  &nbsp;
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  &nbsp;
  <img src="https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turborepo" />
  &nbsp;
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

Aumente a eficiência na organização e entrega de tarefas durante as competições de programação!

O Happy Melon apoia a operação de maratonas no estilo ICPC: administradores e chefes de sala confirmam balões e encaminham impressões; colaboradores no salão pegam as tarefas e entregam aos times, em tempo real.

## Quem usa

### Administradores

Cadastram a competição, as rodadas, a prova, os times, os colaboradores e os chefes. Durante a prova, confirmam balões, encaminham impressões e acompanham o histórico.

- **Competições** — nome, sede e rodadas (ex.: Aquecimento e Prova). Cada rodada tem horário de início e término e, se quiser, congelamento do placar nos últimos minutos.
- **Prova** — questões de cada rodada, com identificador, título e cor do balão.
- **Times** — cadastro um a um ou importação em massa (CSV ou arquivo BOCA), com sala e máquina.
- **Colaboradores** — convite por e-mail, QR e código da competição. Dá para limitar quantos balões cada um leva no lobby e o tempo para entregar.
- **Chefes** — cadastro por nome e e-mail. Recebem uma senha no primeiro cadastro e passam a gerenciar colaboradores e tarefas.
- **Tarefas** — por rodada: confirmar ou reter balões, encaminhar impressões e ver o histórico.

### Chefes de sala

Entram com e-mail e senha, no mesmo lugar que o administrador.

Consultam os detalhes da competição, gerenciam colaboradores e confirmam tarefas em todas as rodadas. Não cadastram prova, times, chefes nem a competição em si.

### Colaboradores

Entram com e-mail e o código da competição. No primeiro acesso, informam o nome.

Antes da prova (e entre uma rodada e outra), veem o cronômetro. Durante a rodada, pegam balões ou impressões na fila **Tarefas**, levam até o time pelo **Lobby** e marcam como entregue. Depois da última rodada, a tela avisa que a competição finalizou.

## Como realizar uma maratona

### 1. Antes da prova

1. Entre como **Administrador ou Chefe de Sala** e abra **Competições** → **Nova Competição**. Informe nome, sede e as **rodadas** (o padrão é Aquecimento e Prova), cada uma com início, término e, se quiser, congelamento.
2. Abra a competição. Dá para incluir ou ajustar rodadas depois, na **Visão geral**.
3. Em **Prova**, escolha a rodada e cadastre as questões (identificador, título e cor do balão). Sem questão, não há balão para confirmar.
4. Em **Times**, cadastre os times ou importe em massa. Sala e máquina aparecem para o colaborador na hora da entrega.
5. Em **Chefes**, adicione nome e e-mail, copie a senha e ligue o acesso de cada chefe.
6. Em **Colaboradores**, convide quem já conhece o e-mail ou compartilhe o QR e o código. Ligue o acesso e, se quiser, defina limite de balões no lobby e tempo para entregar.
7. Os colaboradores entram em **Colaborador** com e-mail e código. Os chefes entram em **Administrador ou Chefe de Sala** com e-mail e senha.

### 2. Durante a prova

1. No horário de cada rodada, a fila **Tarefas** e o **Lobby** são liberados. No intervalo, os colaboradores esperam a próxima.
2. O administrador ou o chefe abre **Tarefas**, escolhe a **rodada** e o time:
   - **Balões conquistados** → **Confirmar** para enviar à fila; **Reter** se não for entregar.
   - **Impressão** → **Encaminhar** para a fila de impressão.
3. O colaborador, na fila **Tarefas**, pega o balão ou a impressão. A tarefa vai para o **Lobby**.
4. No **Lobby**, ele vai até o time (sala e máquina em **Detalhes do time**) e confirma a entrega.
5. Acompanhe o **Histórico de tarefas**. Se os horários mudarem, os colaboradores são avisados na hora.
6. Para tirar alguém da operação, desligue o acesso dessa pessoa. Para pausar o salão inteiro, desligue o acesso dos colaboradores.

### 3. Depois da prova

1. No término da última rodada, os colaboradores veem **A competição finalizou** e não pegam nem entregam mais tarefas.
2. Revise o **Histórico de tarefas** e as conquistas de cada time.
3. Se quiser, desligue o acesso dos colaboradores e deixe a competição em **Finalizadas**.

Fluxo de um balão: **Confirmar** → fila **Tarefas** → **Levantar balão** → **Lobby** → confirmar entrega.

## Instalação

Quem abre o sistema vê só o site. A API pode ficar só na rede interna.

### Pré-requisitos

- Docker e Docker Compose
- Servidor (VPS ou máquina local) com portas livres, ou um proxy reverso na frente

### 1. Obter o código

```bash
git clone https://github.com/guilhermecoding/happy-melon.git
cd happy-melon
```

### 2. Configurar o ambiente

```bash
cp .env.example .env
```

Edite o `.env`. Valores mínimos:

| Variável | O que definir |
| --- | --- |
| `POSTGRES_PASSWORD` | Senha forte do banco |
| `DATABASE_URL` | Mesma senha; host `postgres` no Compose (`postgresql://postgres:SENHA@postgres:5432/hm-db`) |
| `BETTER_AUTH_SECRET` | Secret forte (`openssl rand -base64 32`) |
| `WEB_ORIGIN` | URL pública do **site** (`https://seudominio.com` ou `http://localhost:3001` em teste local) |
| `BETTER_AUTH_URL` | A **mesma** URL do site |
| `NEXT_PUBLIC_APP_URL` | A **mesma** URL do site |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciais do primeiro admin (senha com 8+ caracteres) |
| `ADMIN_NAME` | Nome do admin (opcional; padrão `Admin`) |

Notas:

- Em produção as três URLs públicas são iguais e **HTTPS**.
- O browser **não** precisa da URL da API. O Compose já define `INTERNAL_API_URL=http://api:3000` para o site falar com a API na rede Docker.
- Fora do Compose (Dokploy, dois serviços), defina `INTERNAL_API_URL` na **web** com um endereço que o container da web alcance.
- `POSTGRES_PASSWORD` só é aplicada na **primeira** criação do volume. Para resetar o banco: `docker compose down -v`.

### 3. Subir a aplicação

```bash
docker compose up -d --build
```

Na primeira subida, se as imagens ainda não existirem, o Compose builda sozinho; `--build` força rebuild.

Aguarde a API ficar saudável (as migrations rodam no start):

```bash
docker compose ps
docker compose logs -f api
```

Acessos padrão (sem proxy):

- Site: `http://localhost:3001` (ou a porta de `WEB_PORT`) — é o que as pessoas abrem
- API: `http://localhost:3000` (ou a porta de `API_PORT`) — não precisa expor em produção

### 4. Criar o primeiro administrador

Com a API no ar e `ADMIN_*` preenchidos no `.env`:

```bash
docker compose up -d api
docker compose exec api /app/apps/api/docker-seed-admin.sh
```

Se o script não existir na imagem (build antigo):

```bash
docker compose exec -u root api pnpm --filter api seed:admin
```

### 5. Entrar no sistema

1. Abra a URL do site.
2. Em **Administrador ou Chefe de Sala**, use o e-mail e a senha do primeiro admin.
3. Você entra na área administrativa.

## Produção (servidor próprio + HTTPS)

1. Complete os passos 1–4 com `WEB_ORIGIN`, `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` iguais, em HTTPS (a URL do site).
2. Coloque um reverse proxy (Caddy, Nginx, Traefik ou Dokploy) na frente do **site**. A API pode ficar só na rede interna.
3. Se site e API forem serviços separados, na web defina `INTERNAL_API_URL` para a API (hostname interno ou URL pública da API). Não aponte o browser para essa URL.
4. No firewall, exponha preferencialmente só `80` e `443`.
5. Faça backup periódico do volume Docker `pgdata`.

### Checklist

- [ ] Secrets e senhas fortes
- [ ] `DATABASE_URL` coerente com `POSTGRES_PASSWORD`
- [ ] URL única do site em HTTPS (`BETTER_AUTH_URL`, `WEB_ORIGIN`, `NEXT_PUBLIC_APP_URL`)
- [ ] `INTERNAL_API_URL` na web se não estiver usando o Compose
- [ ] Primeiro administrador criado
- [ ] Proxy reverso + backup do `pgdata`

## Operação do dia a dia

```bash
docker compose up -d          # subir
docker compose ps             # status
docker compose logs -f api web
docker compose down           # parar (mantém o banco)
docker compose down -v        # parar e apagar dados do Postgres
```

Se mudar `NEXT_PUBLIC_APP_URL`, rebuild da web:

```bash
docker compose build --no-cache web
docker compose up -d web
```

Atualize `BETTER_AUTH_URL` / `WEB_ORIGIN` e reinicie a API: `docker compose up -d api`.
