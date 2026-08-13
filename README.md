# 🎈 Happy Melon

Aumente a eficiência na organização e entrega de tarefas durante as competições de programação!

O browser fala **só com o site**. A API pode rodar à parte; a web encaminha `/api`, `/contests`, etc. para o backend. O cookie de sessão fica no mesmo host da página.

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
