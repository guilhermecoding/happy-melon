# 🎈 Happy Melon 🍉

Aumente a eficiência na organização e entrega de tarefas durante as competições de programação!

O Happy Melon apoia a operação de maratonas no estilo ICPC: administradores confirmam balões e encaminham impressões; colaboradores no salão pegam as tarefas e entregam aos times, em tempo real.

O browser fala **só com o site**. A API pode rodar à parte; a web encaminha `/api`, `/contests`, etc. para o backend. O cookie de sessão fica no mesmo host da página.

## Principais funcionalidades

### Administradores

- **Competições** — cadastro com nome, sede, período de prova (`início` / `término`) e status (Habilitada / Desabilitada). Competições finalizadas aparecem separadas na lista.
- **Prova** — questões com identificador, título e cor do balão.
- **Times** — cadastro individual ou importação em massa (CSV padrão ou arquivo BOCA), com sala e máquina.
- **Colaboradores** — convite por e-mail, QR e código da competição, acesso individual ou geral, limite de balões no lobby e timeout de entrega.
- **Tarefas** — confirmar ou reter balões conquistados, encaminhar impressões e acompanhar o histórico.
- **Administradores do sistema** — contas de quem gerencia o Happy Melon.

### Colaboradores

- Login com **e-mail** e **código da competição** (primeiro acesso pede o nome).
- Countdown até o início; após o término, a tela **A competição finalizou**.
- Fila **Tarefas**: pegar balão ou impressão.
- **Lobby**: levar até o time, ver sala/máquina e marcar como entregue.
- Ajustes e horários alterados pelo admin chegam na hora (com aviso).

## Como realizar uma maratona

Ordem recomendada, do cadastro ao encerramento. Os nomes abaixo são os da interface.

### 1. Antes da prova

1. Entre em **Sou Administrador** e abra **Competições** → **Nova Competição**. Preencha nome, sede, data/hora de início e término. Deixe o status **Habilitada**.
2. Abra a competição (**Visão geral**).
3. Em **Prova**, cadastre cada questão (identificador, título e cor do balão). Sem questão, não há balão para confirmar.
4. Em **Times**, cadastre os times ou use **Importar em massa** (CSV: `Nome,Usuario,Sala,Numero da Maquina`, ou arquivo BOCA). Sala e máquina aparecem nos detalhes do colaborador.
5. Em **Colaboradores**:
   - opcionalmente **Adicionar** quem já conhece o e-mail;
   - em **Controle e acesso**, compartilhe o QR ou o código (é o ID da competição);
   - ligue **Acesso dos colaboradores**;
   - em **Ajustes**, defina se quiser **Limite de balões** no lobby e **Timeout de entrega**.
6. Os colaboradores entram em **Sou Colaborador** com e-mail + código. No primeiro acesso, informam o nome. Antes do horário de início, veem o cronômetro.

### 2. Durante a prova

1. No horário de início, a fila **Tarefas** e o **Lobby** dos colaboradores são liberados.
2. No admin, **Tarefas** → escolha o time:
   - **Balões conquistados** → **Confirmar** quando o time deve receber o balão (a tarefa entra na fila dos colaboradores); **Reter** se não for entregar.
   - **Impressão** → **Encaminhar** para a fila de impressão.
3. O colaborador, na fila **Tarefas**, usa **Levantar balão** ou **Pegar impressão**. A tarefa vai para o **Lobby**.
4. No **Lobby**, o colaborador vai até o time (sala/máquina em **Detalhes do time**) e toca **Marcar como entregue**.
5. Acompanhe o **Histórico de tarefas**. Se precisar, altere horários ou ajustes: os colaboradores são avisados na hora.
6. Para tirar alguém da operação, desligue o **Acesso** daquela pessoa. Para pausar todo o salão, desligue **Acesso dos colaboradores** (status **Desabilitada**).

### 3. Depois da prova

1. No horário de término, os colaboradores veem **A competição finalizou** e não conseguem mais pegar nem entregar tarefas.
2. No admin, revise **Histórico de tarefas** e as **Conquistas** de cada time.
3. Opcional: desabilite o acesso dos colaboradores e deixe a competição na seção **Finalizadas**.

Fluxo de um balão: **Confirmar** (admin) → fila **Tarefas** → **Levantar balão** → **Lobby** → **Marcar como entregue**.

## Pré-requisitos

- Docker e Docker Compose
- Acesso ao servidor (VPS ou máquina local) com portas livres (ou proxy reverso)

## 1. Obter o código

```bash
git clone https://github.com/guilhermecoding/happy-melon.git
cd happy-melon
```

## 2. Configurar o ambiente

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
| `NEXT_PUBLIC_APP_URL` | A **mesma** URL do site (entra no build da web; metadata) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciais do primeiro admin (senha com 8+ caracteres) |
| `ADMIN_NAME` | Nome do admin (opcional; padrão `Admin`) |

Notas:

- Em produção as três URLs públicas são iguais e **HTTPS**.
- O browser **não** precisa da URL da API. O Compose já define `INTERNAL_API_URL=http://api:3000` para o servidor Next falar com a API na rede Docker.
- Fora do Compose (Dokploy, dois serviços), defina `INTERNAL_API_URL` na **web** com um endereço que o container da web alcance (URL pública da API ou hostname interno).
- `POSTGRES_PASSWORD` só é aplicada na **primeira** criação do volume. Para resetar o banco: `docker compose down -v`.

## 3. Subir a aplicação

```bash
docker compose up -d --build
```

Na primeira subida, se as imagens ainda não existirem, o Compose builda sozinho; `--build` força rebuild.

Aguarde a API ficar saudável (migrations rodam automaticamente no start):

```bash
docker compose ps
docker compose logs -f api
```

Acessos padrão (sem proxy):

- Site: `http://localhost:3001` (ou a porta de `WEB_PORT`) — é o que os usuários abrem
- API: `http://localhost:3000` (ou a porta de `API_PORT`) — o backend; o site encaminha as chamadas. Não precisa expor em produção.

## 4. Criar o primeiro administrador

Com a API no ar e `ADMIN_*` preenchidos no `.env`:

```bash
docker compose up -d api
docker compose exec api /app/apps/api/docker-seed-admin.sh
```

Se o script não existir na imagem (build antigo):

```bash
docker compose exec -u root api pnpm --filter api seed:admin
```

## 5. Entrar no sistema

1. Abra a URL do site.
2. Em **Sou Administrador**, use o e-mail e a senha do seed.
3. Você deve ser redirecionado para `/admin`.

## 6. Produção (VPS + HTTPS)

1. Complete os passos 1–4 com `WEB_ORIGIN`, `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` iguais, em HTTPS (a URL do site).
2. Reverse proxy (Caddy, Nginx, Traefik, Dokploy) na frente da **web**. A API pode ficar só na rede interna.
3. Se web e API forem serviços separados, na web defina `INTERNAL_API_URL` para a API (hostname interno ou URL pública da API). Não aponte o browser para essa URL.
4. No firewall, exponha preferencialmente só `80`/`443`.
5. Faça backup periódico do volume Docker `pgdata`.

### Checklist

- [ ] Secrets e senhas fortes
- [ ] `DATABASE_URL` coerente com `POSTGRES_PASSWORD`
- [ ] URL única do site em HTTPS (`BETTER_AUTH_URL`, `WEB_ORIGIN`, `NEXT_PUBLIC_APP_URL`)
- [ ] `INTERNAL_API_URL` na web se não estiver usando o Compose
- [ ] Seed do admin executado
- [ ] Proxy reverso + backup do `pgdata`, se necessário

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
